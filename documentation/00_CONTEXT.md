# 00. Product & Team Context

**Last Updated:** March 2026
**Project Name:** Aliado Laboral

---

## 1. The Team

The project is driven by a core founding team focused on scaling LegalTech in Mexico:
- **Misael Morales Urbano**: Lead Founder, Full-stack Developer, and Product Visionary.
- **Miguel Ángel Rodríguez Romero**: Co-founder of *Save Company*.
- **Founding Partner**: Third member focused on the *CIBERT* ONG initiative.

---

## 2. Business Entities

The legal and operational structure relies on a dual-entity ecosystem:

### A. CIBERT (NGO / Asociación Civil)
- **Legal Status**: NGO in the process of formal incorporation.
- **Mission**: Provide accessible legal technology and education to the Mexican workforce.
- **Funding Strategy**: Government and private grants (INDESO, CONAHCYT, International Funds).
- **Ecosystem Role**: Official owner of the "Aliado Laboral" intellectual property and generating the initial financial flow through social impact.

### B. Save Company
- **Legal Status**: Private technology company (S.A. de C.V. or similar).
- **Founders**: Misael Morales Urbano & Miguel Ángel Rodríguez Romero.
- **Ecosystem Role**: Serves as the dedicated software development and maintenance agency. Contracted directly by CIBERT to build and scale the "Aliado Laboral" platform.

---

## 3. The Financial Architecture
To ensure sustainability while maintaining the social mission of the NGO:
1. **App Revenues** (Subscriptions, Leads, Success Fees) flow directly to **CIBERT**.
2. **CIBERT** uses these funds to pay **Save Company** a monthly maintenance and development retainer at fair market value.
3. The founders receive income through their roles in both entities, legally separating the software maintenance business from the social impact NGO.

---

## 4. Platform Core Logic (LFT Engine)
As of **April 2026 (v1.21.0)**, the platform features a centralized, robust engine for calculating labor liquidations:
- **Accuracy**: Strictly follows the Mexican Federal Labor Law (LFT).
- **Flexibility**: Supports user-defined overrides for Aguinaldo, Vacations, and Premiums.
- **Complexity**: Handles advanced scenarios like Salario Diario Integrado (SDI), the 15-year seniority rules, and anniversary-based vacation accumulation.

### 4.1 Admin Panel Maintenance Rules
To avoid regressions in the Admin Dashboard:
- **Individual Gifts**: Always preserve the "Regalo" (Gift) button in `Users.tsx`. It interfaces with `/admin/users/:userId/subscription`.
- **ID Resolution**: For Lawyers, use `userId`. For Workers/Pymes, use `id`.
- **Security**: Never remove the password visibility toggle in `Login.tsx`.

> **Next Strategic Steps:**
> 1. Formally incorporate CIBERT as an A.C.
> 2. Launch Aliado Laboral on the Google Play Store (Currently rolling out).
> 3. Use initial platform revenue to legally incorporate Save Company.
> 4. Formalize the service contract between CIBERT and Save Company.
