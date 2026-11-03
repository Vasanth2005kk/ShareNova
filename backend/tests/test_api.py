"""End-to-end API tests using Flask's test client against a temporary DB and storage dir.

Run from backend/:  python -m pytest -q
"""

import io
import zipfile
from datetime import timedelta

import pytest

from app import create_app
from app.database import SessionFactory
from app.models import File, Share
from app.services import cleanup_service
from app.utils import utcnow

ORIGIN = "http://localhost:5173"


@pytest.fixture()
def app(tmp_path):
    app = create_app(
        {
            "TESTING": True,
            "DATABASE_URL": f"sqlite:///{tmp_path / 'test.db'}",
            "STORAGE_DIR": tmp_path / "storage",
            "BCRYPT_ROUNDS": 4,
            "RATELIMIT_ENABLED": False,
            "MAX_UPLOAD_BYTES": 1024 * 1024,
            "FRONTEND_URL": ORIGIN,
        },
        start_background_jobs=False,
    )
    yield app


@pytest.fixture()
def client(app):
    return app.test_client()


def _upload(client, files, **form):
    data = {"files": [(io.BytesIO(body), name) for name, body in files], **form}
    return client.post("/api/shares/file", data=data, content_type="multipart/form-data")


def _stored_files(app):
    root = app.config["STORAGE_DIR"]
    return [p for p in root.rglob("*") if p.is_file()]


def _expire(uid):
    with SessionFactory() as s:
        share = s.query(Share).filter_by(urlid=uid).one()
        share.expires_at = utcnow() - timedelta(seconds=1)
        s.commit()


# ─── Health / errors / CORS ─────────────────────────────


def test_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.get_json() == {"success": True, "data": {"status": "healthy", "database": "connected"}}


def test_unknown_endpoint_is_json_404(client):
    res = client.get("/api/nope")
    assert res.status_code == 404
    assert res.get_json() == {"success": False, "error": "Endpoint not found"}


def test_method_not_allowed_is_json(client):
    res = client.patch("/api/health")
    assert res.status_code == 405
    assert res.get_json()["success"] is False


def test_cors_preflight_allows_frontend(client):
    res = client.options(
        "/api/shares/text/123456",
        headers={
            "Origin": ORIGIN,
            "Access-Control-Request-Method": "PUT",
            "Access-Control-Request-Headers": "content-type,x-session-token",
        },
    )
    assert res.status_code == 200
    assert res.headers["Access-Control-Allow-Origin"] == ORIGIN
    assert "x-session-token" in res.headers["Access-Control-Allow-Headers"].lower()


def test_cors_rejects_other_origin(client):
    res = client.get("/api/health", headers={"Origin": "http://evil.example"})
    assert "Access-Control-Allow-Origin" not in res.headers


def test_cors_headers_on_error_responses(client):
    res = client.get("/api/shares/000000", headers={"Origin": ORIGIN})
    assert res.status_code == 404
    assert res.headers["Access-Control-Allow-Origin"] == ORIGIN


def test_security_headers(client):
    res = client.get("/api/health")
    assert res.headers["X-Content-Type-Options"] == "nosniff"


# ─── Text shares ────────────────────────────────────────


def test_text_share_lifecycle(client):
    res = client.post("/api/shares/text", json={"title": "Notes", "content": "", "expiresIn": "24h"})
    assert res.status_code == 201
    data = res.get_json()["data"]
    uid = data["uid"]
    assert len(uid) == 6 and uid.isdigit()
    assert data["formattedUID"] == f"{uid[:3]} {uid[3:]}"

    meta = client.get(f"/api/shares/{uid}").get_json()["data"]
    assert meta["type"] == "TEXT" and meta["isPrivate"] is False
    assert meta["expiresAt"].endswith("Z") and meta["createdAt"].endswith("Z")
    assert meta["textShare"] == {"title": "Notes", "language": "plaintext"}

    res = client.put(f"/api/shares/text/{uid}", json={"content": "hello", "title": "New"})
    assert res.status_code == 200
    assert res.get_json()["data"] == {"uid": uid, "updated": True}

    content = client.get(f"/api/shares/{uid}/content").get_json()["data"]
    assert content == {"title": "New", "content": "hello", "language": "plaintext"}

    # Spaces in the code are accepted.
    assert client.get(f"/api/shares/{uid[:3]}%20{uid[3:]}").status_code == 200

    active = client.get("/api/shares/active?limit=12").get_json()["data"]
    assert [s["uid"] for s in active] == [uid]
    assert "password" not in active[0] and "content" not in active[0]

    res = client.delete(f"/api/shares/{uid}")
    assert res.get_json()["data"] == {"uid": uid, "deleted": True}
    assert client.get(f"/api/shares/{uid}").status_code == 404


def test_text_validation_errors(client):
    res = client.post("/api/shares/text", json={"content": "x", "expiresIn": "2y"})
    assert res.status_code == 400
    body = res.get_json()
    assert body["error"] == "Validation failed"
    assert body["details"][0]["field"] == "expiresIn"

    res = client.post("/api/shares/text", data="not json", content_type="text/plain")
    assert res.status_code == 400

    res = client.post("/api/shares/text", json={"content": "x" * 500_001})
    assert res.status_code == 400

    res = client.put("/api/shares/text/123456", json={"title": "missing content"})
    assert res.status_code == 400


def test_invalid_uid_formats(client):
    for bad in ("12345", "1234567", "abcdef", "12345a"):
        res = client.get(f"/api/shares/{bad}")
        assert res.status_code == 400, bad


def test_put_recreates_missing_room(client):
    res = client.put("/api/shares/text/424242", json={"content": "restored", "title": "T"})
    assert res.status_code == 200
    meta = client.get("/api/shares/424242").get_json()["data"]
    assert meta["type"] == "TEXT" and meta["expiresAt"] is not None


def test_put_on_expired_room_recreates_instead_of_500(client):
    uid = client.post("/api/shares/text", json={"content": "old", "expiresIn": "1h"}).get_json()["data"]["uid"]
    _expire(uid)
    assert client.get(f"/api/shares/{uid}").status_code == 404
    res = client.put(f"/api/shares/text/{uid}", json={"content": "new"})
    assert res.status_code == 200
    assert client.get(f"/api/shares/{uid}/content").get_json()["data"]["content"] == "new"


def test_put_on_file_share_is_rejected(client):
    uid = _upload(client, [("a.txt", b"hello")]).get_json()["data"]["uid"]
    res = client.put(f"/api/shares/text/{uid}", json={"content": "x"})
    assert res.status_code == 409


# ─── Password protection ────────────────────────────────


def test_private_text_share_requires_token(client):
    uid = client.post(
        "/api/shares/text", json={"title": "Secret", "content": "s3cret", "password": "pw123"}
    ).get_json()["data"]["uid"]

    assert client.get(f"/api/shares/{uid}").get_json()["data"]["isPrivate"] is True

    res = client.get(f"/api/shares/{uid}/content")
    assert res.status_code == 401

    res = client.put(f"/api/shares/text/{uid}", json={"content": "hack"})
    assert res.status_code == 401
    assert res.get_json()["error"] == "Authentication required"  # exact string the editor checks

    assert client.delete(f"/api/shares/{uid}").status_code == 401

    res = client.post(f"/api/shares/{uid}/verify", json={"password": "wrong"})
    assert res.status_code == 401 and res.get_json()["error"] == "Incorrect password"

    res = client.post(f"/api/shares/{uid}/verify", json={})
    assert res.status_code == 400

    token = client.post(f"/api/shares/{uid}/verify", json={"password": "pw123"}).get_json()["data"]["sessionToken"]
    headers = {"X-Session-Token": token}

    assert client.get(f"/api/shares/{uid}/content", headers=headers).get_json()["data"]["content"] == "s3cret"
    assert client.put(f"/api/shares/text/{uid}", json={"content": "edited"}, headers=headers).status_code == 200
    assert client.get(f"/api/shares/{uid}/content?token={token}").get_json()["data"]["content"] == "edited"

    # A token for one share must not unlock another.
    other = client.post("/api/shares/text", json={"content": "x", "password": "other"}).get_json()["data"]["uid"]
    assert client.get(f"/api/shares/{other}/content", headers=headers).status_code == 401

    assert client.delete(f"/api/shares/{uid}", headers=headers).status_code == 200
    assert client.get(f"/api/shares/{uid}").status_code == 404


def test_verify_public_share_returns_404(client):
    uid = client.post("/api/shares/text", json={"content": "x"}).get_json()["data"]["uid"]
    res = client.post(f"/api/shares/{uid}/verify", json={"password": "x"})
    assert res.status_code == 404


def test_long_password_does_not_crash(client):
    pw = "é" * 100  # 200 bytes, beyond bcrypt's 72-byte limit
    uid = client.post("/api/shares/text", json={"content": "x", "password": pw}).get_json()["data"]["uid"]
    assert client.post(f"/api/shares/{uid}/verify", json={"password": pw}).status_code == 200


# ─── File shares ────────────────────────────────────────


def test_file_upload_download_and_zip(app, client):
    res = _upload(
        client,
        [("a.txt", b"alpha"), ("a.txt", b"second a"), ("../../evil name.bin", b"\x00\x01")],
        expiresIn="1h",
    )
    assert res.status_code == 201, res.get_json()
    uid = res.get_json()["data"]["uid"]

    meta = client.get(f"/api/shares/{uid}").get_json()["data"]
    assert meta["type"] == "FILE" and meta["fileCount"] == 3
    assert meta["totalSize"] == str(5 + 8 + 2)
    names = [f["filename"] for f in meta["files"]]
    assert names == ["a.txt", "a.txt", "evil name.bin"]

    storage_root = app.config["STORAGE_DIR"]
    stored = _stored_files(app)
    assert len(stored) == 3
    assert all(p.resolve().is_relative_to(storage_root / "shares" / uid) for p in stored)

    first = meta["files"][0]
    res = client.get(f"/api/files/{first['id']}/download")
    assert res.status_code == 200 and res.data == b"alpha"
    assert "attachment" in res.headers["Content-Disposition"] and "a.txt" in res.headers["Content-Disposition"]

    res = client.get(f"/api/download/{uid}/all")
    assert res.status_code == 200 and res.mimetype == "application/zip"
    with zipfile.ZipFile(io.BytesIO(res.data)) as zf:
        assert sorted(zf.namelist()) == ["a (1).txt", "a.txt", "evil name.bin"]
        assert zf.read("a.txt") == b"alpha"

    assert client.delete(f"/api/shares/{uid}").status_code == 200
    assert _stored_files(app) == []
    assert not (storage_root / "shares" / uid).exists()
    assert client.get(f"/api/files/{first['id']}/download").status_code == 404


def test_private_file_share_downloads(client):
    uid = _upload(client, [("a.txt", b"a"), ("b.txt", b"b")], password="pw").get_json()["data"]["uid"]
    file_id = client.get(f"/api/shares/{uid}").get_json()["data"]["files"][0]["id"]

    assert client.get(f"/api/files/{file_id}/download").status_code == 401
    assert client.get(f"/api/download/{uid}/all").status_code == 401

    token = client.post(f"/api/shares/{uid}/verify", json={"password": "pw"}).get_json()["data"]["sessionToken"]
    assert client.get(f"/api/files/{file_id}/download?token={token}").status_code == 200
    assert client.get(f"/api/download/{uid}/all?token={token}").status_code == 200
    assert client.get(f"/api/download/{uid}/all", headers={"X-Session-Token": token}).status_code == 200


def test_upload_rejections(app, client):
    assert client.post("/api/shares/file", data={}, content_type="multipart/form-data").status_code == 400

    res = _upload(client, [("run.exe", b"MZ")])
    assert res.status_code == 400 and ".exe" in res.get_json()["error"]

    elf = b"\x7fELF\x02\x01\x01\x00" + b"\x00" * 8 + b"\x02\x00\x3e\x00" + b"\x00" * 200
    res = _upload(client, [("ok.txt", b"fine"), ("innocent.dat", elf)])
    assert res.status_code == 400, res.get_json()

    res = _upload(client, [("big.bin", b"x" * (600 * 1024)), ("big2.bin", b"x" * (600 * 1024))])
    assert res.status_code == 400 and "exceeds" in res.get_json()["error"]

    res = _upload(client, [("huge.bin", b"x" * (3 * 1024 * 1024))])
    assert res.status_code == 413 and res.get_json()["success"] is False

    res = _upload(client, [("a.txt", b"a")], expiresIn="forever")
    assert res.status_code == 400

    # Nothing from the rejected uploads is left on disk or in the DB.
    assert _stored_files(app) == []
    with SessionFactory() as s:
        assert s.query(Share).count() == 0


def test_missing_physical_file_returns_404(app, client):
    uid = _upload(client, [("a.txt", b"a")]).get_json()["data"]["uid"]
    file_id = client.get(f"/api/shares/{uid}").get_json()["data"]["files"][0]["id"]
    for p in _stored_files(app):
        p.unlink()
    assert client.get(f"/api/files/{file_id}/download").status_code == 404
    assert client.get(f"/api/download/{uid}/all").status_code == 404


def test_tampered_storage_key_cannot_escape_root(app, client, tmp_path):
    secret = tmp_path / "secret.txt"
    secret.write_text("top secret")
    uid = _upload(client, [("a.txt", b"a")]).get_json()["data"]["uid"]
    with SessionFactory() as s:
        f = s.query(File).filter_by(urlid=uid).one()
        f.fileurl = "../secret.txt"
        file_id = f.id
        s.commit()
    assert client.get(f"/api/files/{file_id}/download").status_code == 404


# ─── Expiry & cleanup ───────────────────────────────────


def test_expired_shares_hidden_and_cleaned(app, client):
    file_uid = _upload(client, [("a.txt", b"a")], expiresIn="30m").get_json()["data"]["uid"]
    text_uid = client.post("/api/shares/text", json={"content": "x", "expiresIn": "30m"}).get_json()["data"]["uid"]
    keep_uid = client.post("/api/shares/text", json={"content": "keep", "expiresIn": "7d"}).get_json()["data"]["uid"]
    file_id = client.get(f"/api/shares/{file_uid}").get_json()["data"]["files"][0]["id"]

    _expire(file_uid)
    _expire(text_uid)

    assert client.get(f"/api/shares/{file_uid}").status_code == 404
    assert client.get(f"/api/shares/{text_uid}/content").status_code == 404
    assert client.get(f"/api/files/{file_id}/download").status_code == 404
    assert client.get(f"/api/download/{file_uid}/all").status_code == 404
    assert [s["uid"] for s in client.get("/api/shares/active").get_json()["data"]] == [keep_uid]

    assert len(_stored_files(app)) == 1
    removed = cleanup_service.cleanup_expired_shares(app)
    assert removed == 2
    assert _stored_files(app) == []
    with SessionFactory() as s:
        assert [x.urlid for x in s.query(Share).all()] == [keep_uid]
        assert s.query(File).count() == 0


def test_cleanup_worker_thread_runs(app, client):
    uid = client.post("/api/shares/text", json={"content": "x", "expiresIn": "30m"}).get_json()["data"]["uid"]
    _expire(uid)
    app.config["CLEANUP_INTERVAL_SECONDS"] = 3600
    cleanup_service.start_cleanup_worker(app)
    try:
        for _ in range(50):
            with SessionFactory() as s:
                if s.query(Share).count() == 0:
                    break
            import time

            time.sleep(0.05)
        with SessionFactory() as s:
            assert s.query(Share).count() == 0
    finally:
        cleanup_service.stop_cleanup_worker()


def test_rate_limit_returns_json_429(tmp_path):
    app = create_app(
        {
            "TESTING": True,
            "DATABASE_URL": f"sqlite:///{tmp_path / 'rl.db'}",
            "STORAGE_DIR": tmp_path / "storage",
            "RATE_LIMIT_UPLOAD": "2/hour",
            "BCRYPT_ROUNDS": 4,
        },
        start_background_jobs=False,
    )
    client = app.test_client()
    for _ in range(2):
        assert client.post("/api/shares/text", json={"content": "x"}).status_code == 201
    res = client.post("/api/shares/text", json={"content": "x"})
    assert res.status_code == 429
    assert res.get_json()["success"] is False
    # Editor updates use their own, higher limit.
    assert client.put("/api/shares/text/111111", json={"content": "x"}).status_code == 200
