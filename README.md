# ClientPulse Backend — Node.js + Express + TypeScript API

The backend API engine for **ClientPulse**, providing authentication, multi-tenant RBAC, quotation workflows, live client pulse health calculations, and privacy-first local Ollama AI integration.

---

## 💻 Tech Stack
- **Runtime**: Node.js 18+ / 22+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 14+ (with automatic resilient file persistence fallback)
- **Authentication**: Cryptographic JWTs + Bcrypt password hashing + Multi-Tenant RBAC
- **Validation**: Zod Schemas
- **AI Engine**: Local Ollama runtime (`http://localhost:11434`) with heuristic fallback

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Start Development Server
```bash
npm run dev
```
The server runs on `http://localhost:5000`.
- Diagnostic Health Page: `http://localhost:5000/api/v1/health`
- Raw JSON Health Endpoint: `http://localhost:5000/api/v1/health?format=json`

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🌿 Push to GitHub (Standalone Repository)

You can push this backend directly to its own GitHub repository (e.g. for deployment on Render, Railway, AWS, or DigitalOcean):

```bash
git init
git add .
git commit -m "feat: Initial standalone ClientPulse Backend repository"
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/clientpulse-backend.git
git push -u origin main
```
