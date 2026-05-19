<div align="center">

<!-- Animated Header -->
<img src="https://capsule-render.vercel.app/api?type=venom&height=300&color=gradient&customColorList=12,2,20,24,30&text=ShareNova&fontSize=90&fontColor=ffffff&animation=fadeIn&desc=Secure%20Temporary%20File%20and%20Text%20Sharing&descSize=20&descAlignY=62&descAlign=50&stroke=8b5cf6&strokeWidth=1" width="100%"/>

<br/>

<!-- Animated Typing SVG -->
<a href="https://git.io/typing-svg"><img src="https://readme-typing-svg.demolab.com?font=Inter&weight=600&size=22&duration=3000&pause=1000&color=8B5CF6&center=true&vCenter=true&multiline=false&repeat=true&random=false&width=600&height=45&lines=Share+files+with+a+12-digit+code+%F0%9F%94%90;No+accounts.+No+public+links.+Just+privacy.+%E2%9C%A8;Everything+auto-expires.+Zero+traces.+%F0%9F%92%A8" alt="Typing SVG" /></a>

<br/>

<!-- Badges -->
<p>
<img src="https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
<img src="https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
<img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/>
<img src="https://img.shields.io/badge/Python_3.12-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
<img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
<img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind"/>
</p>

<p>
<img src="https://img.shields.io/badge/License-MIT-8b5cf6?style=flat-square" alt="License"/>
<img src="https://img.shields.io/badge/PRs-Welcome-d946ef?style=flat-square" alt="PRs"/>
<img src="https://img.shields.io/badge/Status-Active-22c55e?style=flat-square" alt="Status"/>
</p>

</div>

---

<div align="center">

### 🚀 What is ShareNova?

**ShareNova** is a secure, temporary file and text sharing platform.
Upload files or paste text → get a **12-digit code** → share the code → recipient retrieves content.
**No accounts. No public URLs. Everything auto-expires.**

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔐 Security First
- **UID-only access** — no guessable URLs
- **Password protection** with bcrypt hashing
- **Magic-byte MIME validation** — blocks dangerous files
- **Presigned URL downloads** — storage keys never exposed
- **Rate limiting** across 4 tiers

</td>
<td width="50%">

### ⚡ Lightning Fast
- **Vite 6** hot reload in under 600ms
- **FastAPI** async backend on Python 3.12
- **SQLAlchemy 2** async ORM with connection pooling
- **APScheduler** cleanup worker every 5 minutes
- **Instant code generation** from 6 random bytes

</td>
</tr>
<tr>
<td width="50%">

### 🎨 Premium UI
- **Glassmorphic dark theme** with noise texture
- **Framer Motion** animations throughout
- **Per-letter 3D animated** brand title with glow
- **Floating orb** particle background
- **Responsive** across all screen sizes

</td>
<td width="50%">

### 🕐 Auto-Expiry
- **5 expiry tiers:** 1h, 6h, 24h, 7d, 30d
- **Automatic cleanup** of expired shares
- **Storage purge** — files deleted from R2/S3
- **Session tokens** with 15-minute TTL
- **Countdown timer** on shared content

</td>
</tr>
</table>

---

## 🏗️ Architecture

```mermaid
graph LR
    A[React + Vite] -->|fetch| B[FastAPI]
    B -->|SQLAlchemy| C[(PostgreSQL)]
    B -->|boto3| D[Cloudflare R2]
    B -->|APScheduler| E[Cleanup Worker]
    B -->|passlib| F[bcrypt]
    B -->|slowapi| G[Rate Limiter]
```

### Tech Stack

| Layer | Technology | Replaces |
|:------|:-----------|:---------|
| **Frontend** | React 19 + Vite 6 + JavaScript | Next.js + TypeScript |
| **Styling** | Tailwind CSS v4 + Framer Motion | — |
| **Routing** | React Router v6 (`createBrowserRouter`) | Next.js App Router |
| **Backend** | FastAPI + Python 3.12 | Express 5 + TypeScript |
| **ORM** | SQLAlchemy 2 async + asyncpg | Prisma |
| **Migrations** | Alembic | Prisma Migrate |
| **Validation** | Pydantic v2 | Zod |
| **Auth** | passlib[bcrypt] | bcrypt (npm) |
| **Storage** | boto3 (S3-compatible) | @aws-sdk/client-s3 |
| **Rate Limiting** | slowapi | express-rate-limit |
| **Scheduler** | APScheduler (AsyncIOScheduler) | node-cron |
| **MIME Check** | python-magic | file-type (npm) |
| **ZIP Streaming** | Python zipfile + StreamingResponse | archiver (npm) |
| **Env Config** | pydantic-settings | dotenv + Zod |

---

## 📁 Project Structure

```
ShareNova/
├── frontend/                    # React + Vite (JavaScript)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # Navbar, CountdownTimer
│   │   │   ├── forms/           # PasswordGate, ShareOptionsForm
│   │   │   ├── share/           # UIDDisplay, UIDInput, TextShareView, FileShareView
│   │   │   └── upload/          # DropZone, ProgressBar
│   │   ├── lib/                 # api.js, constants.js, uid.js
│   │   ├── pages/               # Home, Upload, Text, Retrieve
│   │   ├── App.jsx              # React Router config
│   │   ├── main.jsx             # Vite entry point
│   │   └── index.css            # Tailwind + custom animations
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env
│
├── backend/                     # FastAPI + Python
│   ├── app/
│   │   ├── config.py            # pydantic-settings env validation
│   │   ├── database.py          # SQLAlchemy async engine
│   │   ├── models.py            # Share, File, TextShare ORM models
│   │   ├── schemas.py           # Pydantic request/response models
│   │   ├── routers/
│   │   │   ├── shares.py        # CRUD + password verify + text content
│   │   │   ├── files.py         # Presigned URL file download
│   │   │   ├── download.py      # ZIP streaming
│   │   │   └── health.py        # Health check
│   │   ├── services/
│   │   │   ├── uid_service.py   # 12-digit UID generation
│   │   │   ├── share_service.py # Core CRUD operations
│   │   │   ├── password_service.py  # bcrypt + session tokens
│   │   │   ├── storage_service.py   # R2/S3 via boto3
│   │   │   └── cleanup_service.py   # Expired share purge
│   │   └── middleware/
│   │       ├── rate_limiter.py  # slowapi tiers
│   │       ├── mime_validator.py # python-magic validation
│   │       └── security.py     # Helmet-equivalent headers
│   ├── alembic/                 # Database migrations
│   ├── main.py                  # FastAPI entry point
│   ├── requirements.txt
│   ├── alembic.ini
│   └── .env
│
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.12+**
- **Node.js 18+** (for frontend dev server only)
- **PostgreSQL 14+**

### 1. Clone the Repository

```bash
git clone https://github.com/numankhan2007/ShareNova.git
cd ShareNova
```

### 2. Set Up the Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database credentials and R2 keys

# Start the server
python main.py
```

The API will be running at `http://localhost:8000`

### 3. Set Up the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be running at `http://localhost:5173`

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

```env
PORT=8000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/sharenova
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=sharenova
BCRYPT_ROUNDS=12
SESSION_SECRET=your_32_char_random_string
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8000
```

---

## 🔒 Security Model

```
┌─────────────────────────────────────────────────────┐
│  Client (Browser)                                   │
│  ├─ Never sees storage keys                         │
│  ├─ Never sees password hashes                      │
│  ├─ Sends X-Session-Token for private shares        │
│  └─ Downloads via presigned URL redirect (60s TTL)  │
├─────────────────────────────────────────────────────┤
│  FastAPI Server                                     │
│  ├─ Helmet-equivalent security headers              │
│  ├─ CORS locked to FRONTEND_URL only                │
│  ├─ 4-tier rate limiting (slowapi)                  │
│  ├─ Pydantic v2 request validation                  │
│  ├─ Magic-byte MIME checking (python-magic)         │
│  └─ bcrypt password hashing (cost factor 12)        │
├─────────────────────────────────────────────────────┤
│  PostgreSQL                                         │
│  ├─ Parameterized queries (SQLAlchemy)              │
│  └─ Indexes on uid, expires_at                      │
├─────────────────────────────────────────────────────┤
│  Cloudflare R2                                      │
│  ├─ Server-side presigned URLs only                 │
│  └─ Batch delete on share expiry                    │
└─────────────────────────────────────────────────────┘
```

---

## 📡 API Reference

| Method | Endpoint | Description | Rate Limit |
|:-------|:---------|:------------|:-----------|
| `POST` | `/api/shares/file` | Upload files, get UID | 10/hour |
| `POST` | `/api/shares/text` | Create text share, get UID | 10/hour |
| `GET` | `/api/shares/{uid}` | Get share metadata | 20/minute |
| `POST` | `/api/shares/{uid}/verify` | Verify password, get session token | 5/10min |
| `GET` | `/api/shares/{uid}/content` | Get text content | 20/minute |
| `GET` | `/api/files/{id}/download` | Download file (redirect) | 20/minute |
| `GET` | `/api/download/{uid}/all` | Download all as ZIP | 20/minute |
| `GET` | `/api/health` | Health check | — |

**Response Envelope:**
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

---

## 🧬 UID Generation Algorithm

```python
# 1. Generate 6 cryptographic random bytes
raw = secrets.token_bytes(6)

# 2. Interpret as big-endian unsigned integer
num = int.from_bytes(raw, byteorder="big")

# 3. Convert to decimal, take first 12 digits
decimal_str = str(num)[:12]

# 4. Zero-pad to exactly 12 digits
uid = decimal_str.zfill(12)

# Result: "483920174651"
# Display: "4839 2017 4651"
```

---
