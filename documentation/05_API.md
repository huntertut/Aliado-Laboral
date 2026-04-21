# 05. API Reference

This document outlines the core backend endpoints. The API is built on `Express.js` using `TypeScript` and connects to `Prisma` (SQLite).

## Base URL
- **Production:** `https://api.cibertmx.org/api`
- **Prefix:** `/api` is required for all endpoints due to internal reverse proxying.

---

## 1. Authentication (`/auth`)
- `POST /auth/register/worker` - Registers a new worker and calculates trial days.
- `POST /auth/register/lawyer` - Registers a lawyer.
- `POST /auth/register/pyme` - Registers a corporate client (`assignedLawyerId` is optional, handled via Null Coalescing fallback).
- `POST /auth/verify-token` - Validates the Firebase JWT and syncs the user role.

## 2. Artificial Intelligence (`/ai`)
- `POST /ai/chat` - Engages "Elías", the virtual advisor.
- `POST /ai/analyze-case` - Connects to Llama-3 70B via Groq to summarize and anonymize documents or text (Legal Armor).

## 3. LFT Calculator (`/calculator`)
- `POST /calculator/calculate` - Takes daily wage, dates, and returns formatted severance pay data based on Mexican Federal Labor Law.

## 4. Admin Management (`/admin`)
*(Protected by Internal JWT Admin Middleware)*
- `GET /admin/dashboard` - KPI and stats overview.
- `GET /admin/lawyers` - Lists all lawyers.
- `PUT /admin/lawyers/:id/verify` - Approves a pending lawyer's license.
- `POST /admin/lawyers/sync-firebase` - Scans Firebase for disconnected user records and creates "stubs" in the local DB.
- `PUT /admin/security/password` - Updates the Super Admin bcrypt password.
- `POST /admin/lawyers/:lawyerId/free-leads-quota` - Sets the monthly leads quota for a verified lawyer.
- `PUT /admin/users/:userId/subscription` - Overrides a user's subscription (any role).

## 5. Promotions & Subscriptions (`/promotions`, `/payment`)
- `GET /promotions/active` - Returns the currently active marketing campaigns.
- `POST /payment/create-checkout-session` - Generates a Stripe URL to acquire Lead Fees or Subscriptions.
