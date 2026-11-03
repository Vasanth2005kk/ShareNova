from flask import Flask

from app.routes import files, health, shares


def register_blueprints(app: Flask) -> None:
    app.register_blueprint(health.bp)
    app.register_blueprint(shares.bp)
    app.register_blueprint(files.files_bp)
    app.register_blueprint(files.download_bp)
