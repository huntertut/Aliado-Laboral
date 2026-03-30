# 08. Security Protocols

Security is critical given the legal and financial nature of the platform. The system uses a multi-layered approach.

## 1. Authentication Layer
- **Client App:** Handled entirely by `Firebase Authentication`. Users receive a short-lived JSON Web Token (JWT) that gets appended to standard HTTP headers (`Authorization: Bearer <TOKEN>`).
- **Backend Middleware:** The Node.js Express server intercepts all `/api/*` traffic to mathematically verify the signature of the Firebase JWT before proceeding. If invalid, it returns `401 Unauthorized`.
- **Admin App:** The Web Dashboard uses a custom JWT session backed by a `Bcrypt` hashed password in the `Admin` table.

## 2. Data Encryption and Privacy
- **Legal Armor Engine (AI):** When a worker submits a description of their legal issue, the AI (`aiController`) intervenes immediately to extract and redact sensitive PII (Personally Identifiable Information) — such as full names, exact geographic coordinates, and corporate entity names — before that text is ever visible to lawyers in the marketplace.
- **Database:** All data rests in an encrypted volume in DigitalOcean.

## 3. Access Monitoring
- **Failed Logins:** The platform logs all failed authentication attempts into the `SecurityLog` table.
- Admins can review anomalous IPs and brute-force attempts from the **Seguridad** tab on the Admin Dashboard.

## 4. Operational Guardrails
- **Null Coalescing Security:** `authController` protects relational foreign keys (e.g., PyME to Lawyer) by converting empty string submissions (`""`) from mobile apps into strict SQL `NULL` states to avoid Prisma schema constraint crashes.
- **PM2 Strict Extermination:** Host-level PM2 scripts are forbidden. All server software runs securely within Docker to prevent rogue legacy code from hijacking ports.
