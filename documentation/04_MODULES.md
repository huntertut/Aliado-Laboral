# 04. System Modules

This document breaks down the core engines that power the Aliado Laboral backend.

---

## 1. Hybrid Authentication (`authController` & `firebaseAuthController`)
- **Function:** Manages identities, roles, and automated onboarding.
- **Technology:** Firebase Auth (Client Login) + Prisma DB (User Roles).
- **Roles:**
  - `Worker`: End-user seeking legal help (Freemium/Premium).
  - `Lawyer`: Partner attorney (Basic/PRO).
  - `PyME`: Corporate client (Shield).
  - `Admin`: Superuser accessing the web dashboard.
- **Firebase Sync:** Automatically provisions missing Developer profiles (`Lawyer` stub records) so new registrations immediately appear as "Pending" in the Admin Panel.

## 2. Artificial Intelligence Engine (`aiController`)
- **Function:** The legal brain of the app.
- **Capabilities:**
  - **Virtual Advisor ("Elías"):** Answers labor law queries in real-time.
  - **Legal Armor:** Detects sensitive data (names, exact amounts) and anonymizes them before broadcasting to lawyers.
  - **HOT Classifier:** Flags high-value cases (e.g., >$150k MXN or severe harassment).

## 3. LFT Calculator (`calculatorController`)
- **Function:** Estimates severance based on the *Ley Federal del Trabajo*.
- **Input:** Daily salary, start/end dates, reason for separation.
- **Output:** Detailed breakdown (Aguinaldo, Vacations, Vacation Premium, 3 Months Constitutional, 20 Days per Year).
- **Value Add:** Generates shareable visual infographics.

## 4. Marketplace / "El Puente" (`contactController`)
- **Function:** Connects workers with verified lawyers.
- **Flow:**
  1. Worker requests representation.
  2. System notifies compatible lawyers (based on Geolocation + Specialty).
  3. Lawyer pays a Lead Fee to unlock the case.
  4. Secure chat channel opens.

## 5. Subscription Engine (`paymentController`)
- **Function:** Manages recurring revenue and billing.
- **Technology:** Stripe Subscriptions.
- **Logic:**
  - Automated monthly billing.
  - Dunning process (retries for failed payments).
  - Automatic downgrade/cancellations.

## 6. Promotions Engine (`promotionController`)
- **Function:** Dynamically manages marketing campaigns.
- **Features:** Grants automatic "Trial Days" based on active DB campaigns when new users register. Math is calculated automatically via `startDate` and `endDate`.

## 7. Community & Forum (`forumController`)
- **Function:** Builds social proof and reputation scoring.
- **Mechanics:** Workers ask anonymous questions; ANY authenticated user (including lawyers) can respond to build community trust.
- **Moderation:** AI filters insults and spam.

## 8. Administrative Dashboard (`adminController`)
- **Function:** Total business overview.
- **Capabilities:**
  - Dashboard KPIs (MRR, Closed cases, Conversion rates).
  - Manual verification of lawyer licenses.
  - Emergency Sync (`/admin/lawyers/sync-firebase`).
  - Strict Security Logs (Failed logins).
