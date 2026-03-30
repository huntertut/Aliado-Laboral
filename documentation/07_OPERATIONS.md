# 07. Operations & Administration

The day-to-day management of Aliado Laboral is conducted entirely from the Admin Web Dashboard.

## 1. Dashboard Operations
- **URL:** `https://api.cibertmx.org/admin` (or root when mapped).
- **KPI Metrics:** Track MRR, Active Subscribers, and Conversion Rates.

## 2. Lawyer Lifecycle Management
Lawyers registering via the mobile app are deposited automatically into the Admin Dashboard as "Pending".
1. **Verification (Manual):** Navigate to the **Usuarios** tab to see pending lawyers marked in red.
2. **Action:** Admins must cross-reference the professional license number against the local government registry. Once validated, click "Approve" (`isVerified: true`).
3. **Recovery Sync:** If a lawyer is registered in Firebase but missing from the dashboard, use the "Force Sync Firebase" utility to create their missing database record.

## 3. Marketing Promotions
The platform features an advanced dynamic promotion engine replacing old hardcoded switches.
- **Workflow:** Navigate to **Promociones** to create a specific campaign (e.g., "Buen Fin").
- **Parameters:** Define the `startDate`, `endDate`, and the target audience (`Worker`, `Lawyer`, `PYME`).
- **Effect:** The backend mathematically subtracts the dates, calculates the "Free Trial Days", and auto-applies them to the Stripe Subscription limits of new sign-ups.

## 4. Case Auditing
- Review active legal cases in the **Cases** tab to ensure lawyers are completing their milestones properly.
- If an attorney stops responding, the Admin can manually force a status update or reassign the worker's case.
