<div align="center">

<!-- Animated Header -->
<img src="https://capsule-render.vercel.app/api?type=venom&height=300&color=gradient&customColorList=12,2,20,24,30&text=ShareNova&fontSize=90&fontColor=ffffff&animation=fadeIn&desc=Secure%20Temporary%20File%20%26%20Text%20Sharing&descSize=20&descAlignY=62&descAlign=50&stroke=8b5cf6&strokeWidth=1" width="100%"/>

<br/>

<!-- Animated Typing SVG -->
<a href="https://git.io/typing-svg"><img src="https://readme-typing-svg.demolab.com?font=Inter&weight=600&size=22&duration=3000&pause=1000&color=8B5CF6&center=true&vCenter=true&multiline=true&repeat=true&random=false&width=600&height=80&lines=Share+files+with+a+12-digit+code+%F0%9F%94%90;No+accounts.+No+public+links.+Just+privacy.+%E2%9C%A8;Everything+auto-expires.+Zero+traces.+%F0%9F%92%A8" alt="Typing SVG" /></a>

<br/>

<!-- Badges Row 1 -->
[![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Express](https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)

<!-- Badges Row 2 -->
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://prisma.io)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://cloudflare.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://framer.com/motion)

<br/>

<!-- Animated Divider -->
<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

</div>

## 🌟 What is ShareNova?

**ShareNova** is a secure, temporary file and text sharing platform built around a **UID-first retrieval model**. Instead of shareable URLs (which can be guessed or leaked), ShareNova generates a **12-digit cryptographically random numeric code** that users input manually to retrieve content.

> **No accounts. No public links. No storage URLs exposed. Ever.**

<div align="center">

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     Upload files or text  →  Get a 12-digit code  →  Share   ║
║                                                              ║
║     Recipient enters code  →  Verifies password  →  Download ║
║                                                              ║
║     Auto-expires. Auto-deletes. Zero traces.                 ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

</div>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## ⚡ Key Features

<table>
<tr>
<td width="50%">

### 🔐 UID-First Security
- 12-digit cryptographic numeric UID
- No public URLs — ever
- Storage keys are never exposed to clients
- Downloads proxied via presigned URLs (60s TTL)

### ⏰ Auto-Expiry System
- Configurable: 1h, 6h, 24h, 7d, 30d
- Cron worker purges expired shares every 5 min
- R2 objects + DB records cleaned simultaneously
- Cascade deletes ensure consistency

### 🔒 Password Protection
- Optional bcrypt-hashed passwords (cost=12)
- Redis-backed session tokens (15-min TTL)
- Brute-force protection: 5 attempts per 10 min
- No cookies, no JWTs — stateless tokens

</td>
<td width="50%">

### 📁 File Sharing
- Drag-and-drop upload with progress tracking
- Up to 20 files, 500MB total per share
- MIME validation via magic bytes (not headers)
- ZIP download for multi-file shares
- Dangerous file types blocked

### 📝 Text Sharing
- Monospace editor with syntax highlighting tags
- 23 language presets
- 500KB max content
- One-click copy to clipboard

### 🎨 Premium UI/UX
- Dark glassmorphic design
- Per-letter staggered hero animation
- Framer Motion throughout
- Fully responsive
- Auto-formatting UID input

</td>
</tr>
</table>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 🏗️ Architecture

<div align="center">

```mermaid
graph TB
    subgraph Client["🖥️ Client Layer — Next.js 16"]
        LP[Landing Page]
        UP[Upload Page]
        TP[Text Editor]
        RP[Retrieve Page]
    end

    subgraph API["⚙️ API Layer — Express 5"]
        SR[Share Router]
        FR[File Router]
        AR[Auth Router]
        ZR[ZIP Router]
    end

    subgraph Services["🔧 Service Layer"]
        SS[ShareService]
        STS[StorageService]
        PS[PasswordService]
        CS[CleanupService]
        US[UIDService]
    end

    subgraph Infra["☁️ Infrastructure"]
        PG[(PostgreSQL)]
        R2[(Cloudflare R2)]
        CR[Cron Worker]
    end

    Client -->|REST / HTTPS| API
    API --> Services
    SS --> PG
    STS --> R2
    US --> PG
    CS --> PG
    CS --> R2
    CR --> CS

    style Client fill:#1a1a2e,stroke:#8b5cf6,color:#fff
    style API fill:#1a1a2e,stroke:#22c55e,color:#fff
    style Services fill:#1a1a2e,stroke:#3b82f6,color:#fff
    style Infra fill:#1a1a2e,stroke:#f59e0b,color:#fff
```

</div>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 📂 Project Structure

```
ShareNova/
│
├── 📁 frontend/                     Next.js 16 (App Router)
│   ├── 📁 src/
│   │   ├── 📁 app/
│   │   │   ├── 📄 page.tsx          Landing — animated hero, features, CTAs
│   │   │   ├── 📁 upload/           File upload flow
│   │   │   ├── 📁 text/             Text/paste share flow
│   │   │   └── 📁 retrieve/         UID entry + share viewer
│   │   ├── 📁 components/
│   │   │   ├── 📁 common/           Navbar, CountdownTimer
│   │   │   ├── 📁 upload/           DropZone, ProgressBar
│   │   │   ├── 📁 share/            UIDDisplay, UIDInput, ShareViews
│   │   │   └── 📁 forms/            ShareOptionsForm, PasswordGate
│   │   ├── 📁 lib/                  API client, UID utils, constants
│   │   └── 📁 types/                Shared TypeScript interfaces
│   └── 📄 .env.local
│
├── 📁 backend/                      Express 5 + TypeScript
│   ├── 📁 src/
│   │   ├── 📁 routes/               shares, files, download, health
│   │   ├── 📁 services/             Share, Storage, Password, UID, Cleanup
│   │   ├── 📁 middleware/           rateLimiter, validateBody, mimeValidator
│   │   ├── 📁 config/               Zod-validated env
│   │   ├── 📁 db/                   Prisma client singleton
│   │   └── 📄 app.ts               Server entry point
│   └── 📁 prisma/
│       └── 📄 schema.prisma         Database schema
│
└── 📄 README.md
```

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 🔑 How the UID System Works

<div align="center">

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   crypto.randomBytes(6)                    // 48 bits entropy   │
│       ↓                                                         │
│   BigInt('0x' + bytes.toString('hex'))      // → decimal        │
│       ↓                                                         │
│   .toString().slice(0, 12).padStart(12, '0')                    │
│       ↓                                                         │
│   Uniqueness check (index scan, not table scan)                 │
│       ↓                                                         │
│   Display: 4839 2017 4651                                       │
│   Stored:  483920174651  (VARCHAR(12) UNIQUE NOT NULL)          │
│                                                                 │
│   Collision rate: ~0.5% at 100M shares → retry loop (max 10)   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

</div>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 🛡️ Security Model

| Layer | Implementation |
|:------|:---------------|
| **Transport** | HTTPS enforced, Helmet security headers |
| **Input** | Zod schema validation on all request bodies |
| **Files** | Magic-byte MIME validation (not Content-Type headers) |
| **Passwords** | bcrypt cost-12, never logged or cached |
| **Sessions** | Stateless tokens, 15-min TTL, header-based |
| **Storage** | No raw R2/S3 URLs exposed — presigned with 60s TTL |
| **Rate Limiting** | Retrieval: 20/min, Passwords: 5/10min, Uploads: 10/hr |
| **Cleanup** | Expired shares auto-purged every 5 minutes |
| **Downloads** | Proxied through API — revoking = deleting the DB record |

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+
- **PostgreSQL** 15+
- **Cloudflare R2** bucket (for file uploads)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/ShareNova.git
cd ShareNova

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
# Backend — copy and fill in your credentials
cp backend/.env.example backend/.env
```

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/sharenova
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=sharenova
SESSION_SECRET=a_random_32_character_string_here
```

### 3. Set Up Database

```bash
cd backend

# Push Prisma schema to PostgreSQL
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### 4. Launch

```bash
# Terminal 1 — Backend (port 4000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend && npm run dev
```

<div align="center">

**Open [http://localhost:3000](http://localhost:3000) and start sharing! 🚀**

</div>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 📡 API Reference

| Method | Endpoint | Purpose |
|:------:|:---------|:--------|
| `POST` | `/api/shares/file` | Upload files, returns UID |
| `POST` | `/api/shares/text` | Create text share, returns UID |
| `GET` | `/api/shares/:uid` | Fetch share metadata |
| `POST` | `/api/shares/:uid/verify` | Verify password → session token |
| `GET` | `/api/shares/:uid/content` | Fetch text content (gated) |
| `GET` | `/api/files/:id/download` | Proxy presigned download |
| `GET` | `/api/download/:uid/all` | Stream ZIP of all files |
| `GET` | `/api/health` | Health check |

> All responses use a consistent `{ success, data, error }` JSON envelope.

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 🗄️ Database Schema

```prisma
model Share {
  id           String    @id @default(cuid())
  uid          String    @unique @db.VarChar(12)
  type         ShareType // FILE | TEXT
  isPrivate    Boolean   @default(false)
  passwordHash String?
  expiresAt    DateTime?
  createdAt    DateTime  @default(now())
  totalSize    BigInt    @default(0)
  files        File[]
  textShare    TextShare?
  @@index([uid])
  @@index([expiresAt])
}

model File {
  id         String @id @default(cuid())
  shareId    String
  filename   String
  storageKey String  // internal R2 key — NEVER exposed
  mimeType   String
  size       BigInt
}

model TextShare {
  id       String  @id @default(cuid())
  shareId  String  @unique
  title    String?
  content  String  @db.Text
  language String  @default("plaintext")
}
```

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 🛣️ Roadmap

- [x] Core backend with Prisma + Express
- [x] UID generation with collision retry
- [x] File upload & text share APIs
- [x] Password protection with bcrypt
- [x] Download proxy with presigned URLs
- [x] Cleanup cron worker
- [x] Next.js frontend with glassmorphic design
- [x] Animated landing page
- [ ] Redis-backed rate limiting & sessions
- [ ] Syntax highlighting in text viewer
- [ ] "Burn after read" mode
- [ ] User accounts (optional)
- [ ] QR code for UID sharing
- [ ] End-to-end encryption

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 🧰 Tech Stack

<div align="center">

| Category | Technology |
|:---------|:-----------|
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | Express 5, TypeScript, Prisma ORM, Zod |
| **Database** | PostgreSQL 16 |
| **Object Storage** | Cloudflare R2 (S3-compatible) |
| **Auth** | bcrypt + stateless session tokens |
| **Validation** | Zod schemas + magic-byte MIME detection |
| **Scheduling** | node-cron (cleanup worker) |
| **Security** | Helmet, CORS, express-rate-limit |

</div>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&height=120&color=gradient&customColorList=12,2,20,24,30&section=footer" width="100%"/>

**Built with 💜 and privacy in mind**

<a href="https://github.com/yourusername/ShareNova/stargazers">
  <img src="https://img.shields.io/github/stars/yourusername/ShareNova?style=for-the-badge&color=8b5cf6&labelColor=1a1a2e" alt="Stars"/>
</a>

</div>
