# 03. Technical Architecture

**Philosophy:** Designed for rapid iteration, low operational cost, and high scalability across Mexico.

---

## 1. Technology Stack

### A. Frontend (Mobile App)
- **Framework:** **Expo SDK 52** (React Native 0.76)
  - *Advantage:* Enables Over-the-Air (OTA) updates via EAS, bypassing lengthy App Store review processes for quick patches.
- **Navigation:** `React Navigation 7` (Stack + Tabs)
- **State Management:** `Context API` + `Zustand` (Lightweight and fast)
- **UI System:** Native `StyleSheet` + `Lucide Icons` + `expo-linear-gradient`

### B. Backend (API & Admin Web)
- **Runtime:** **Node.js v20** (LTS)
- **Framework:** `Express.js` (TypeScript)
- **ORM:** `Prisma` (Type-safe database queries)
- **Security:** `Helmet`, `CORS`, `Rate Limiting`, `Bcrypt` (For Admin passwords).
- **Admin Frontend:** `React` (Vite) + `TailwindCSS`

### C. Database
- **Engine:** **SQLite** (Current Production)
  - *Rationale:* Zero latency, simple backups (single file), highly efficient for the current traffic volume.
  - *Future Migration:* Ready to migrate to **PostgreSQL** when user base exceeds 1M records (Prisma makes this transition seamless).
- **Storage:** Mounted persistent volume on DigitalOcean.

### D. Artificial Intelligence (The Brain)
- **Model:** **Llama-3 70B** (via Groq API)
  - *Speed:* Inference responses in <800ms.
  - *Cost Efficiency:* ~10x cheaper than OpenAI GPT-4.
- **Key Functions:**
  - Sentiment Analysis (e.g., detecting severe harassment).
  - Case Classification (HOT leads vs. Standard).
  - Legal summarization and formatting.

---

## 2. Cloud Infrastructure

- **Provider:** **DigitalOcean**
- **Server:** Droplet (Ubuntu 22.04 LTS)
- **Containerization:** **Docker Compose**
  - `backend-backend-1` (Node.js API)
- **Web Server:** `Nginx` (Reverse Proxy) + SSL via `Certbot`.
- **Process Management:** Docker handles daemonization (PM2 has been explicitly purged to prevent port conflicts).

---

## 3. Data Flow Diagram (The Core Loop)

1. **User (App):** Submits text or audio describing a labor issue.
2. **API (Nginx -> Node):** Validates the Firebase JWT Token.
3. **Controller (`aiController`):** Sends prompt to Groq AI for legal analysis.
4. **Database:** Saves the `LegalCase` and the AI's response via Prisma.
5. **Notification:** Fires FCM Push Notification to the appropriate Lawyer.
6. **Response:** The user sees the evaluation on their screen in <2 seconds.
