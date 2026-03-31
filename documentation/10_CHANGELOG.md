# 10. Changelog & Version History

All notable changes to the Aliado Laboral ecosystem (Mobile App, Backend, and Admin Web) are documented here.

---

## [v1.20.0] - March 2026 (Phase 18 & 19)
- **Feature (Mobile UI):** Rediseño completo de la Pantalla de Inicio (Action Dashboard). Nueva interfaz orientada a la conversión con Zonas (Gancho Calculadora, Grid 2x2 tonos pastel, Menú horizontal de apoyo).
- **Maintenance (Mobile):** Incremented Android `versionCode` from 6 to 7 to resolve Google Play Console upload collisions. Generated new `.AAB` bundle.
- **Feature (Payments):** Implementación de Webhooks de Stripe como fuente única de verdad para la validación de pagos, garantizando idempotencia y eliminando la dependencia de confirmaciones del frontend. Añadidos modelos `Payment` y `StripeEvent`.
- **Feature (Sync):** Implemented the Firebase-to-PostgreSQL Lawyer Registration Sync. Lawyers registering via the app are automatically stubbed in the DB as "PENDING".
- **Feature (UX):** Added a native 48-hour SLA alert to the `RegisterScreen.tsx` para registering lawyers.
- **Feature (Admin):** Added a dynamic red notification badge to the "Usuarios" tab in `AdminLayout.tsx` and a manual `/admin/lawyers/sync-firebase` recovery endpoint.
- **Maintenance:** Completely reorganized the `C:\dev\aliado-laboral\documentation` folder into a standardized 11-file markdown structure, migrating 25 legacy assets to the `/legacy` fallback directory.

---

## [v1.19.1] - March 2026 (Phase 12 & 13)
- **Bugfix (Critical):** Exterminated a rogue native `PM2` process on the DigitalOcean host that was hijacking port 3001 and causing stale database schema queries (Error 500).
- **Bugfix (PyME):** Patched a Prisma P2003 Foreign Key Constraint crash occurring when PyMEs registered with an empty `assignedLawyerId` string. Added Null Coalescing fallback in `authController.ts`.

---

## [v1.19.0] - March 2026 (Phase 10 & 11)
- **Feature (Security):** Hardened the Admin Dashboard. Migrated from hardcoded passwords to standard `Bcrypt` hashing in the database. Added a password reset UI in Settings.
- **Feature (Calendar):** Improved the Dynamic Promotions Engine by calculating automatic "Free Trial Days" based on explicit `startDate` and `endDate` intervals.
- **Maintenance (Host):** Sent a `nohup` keep-alive pulse to the CentOS host to stabilize the Node runtime.
- **UI/UX:** Overhauled Admin UI with high-resolution brand logos and a unified sidebar structure.

---

## [v1.18.0] - March 2026 (Phase 8 & 9)
- **Feature (Marketing):** Engineered the Advanced Promotions Engine. Replaced a simple toggle switch with a full CRUD system (`Promotion` table) capable of segmenting discounts by target role (Worker vs. Lawyer).
- **Feature (Audit):** Added a new Security Log system (`SecurityLog`) tracking failed login attempts into the Admin Panel.
- **UX Fix:** Disabled mobile native `autoCapitalize` and `autoCorrect` on custom password input fields, effectively solving the "Passwords do not match" bug reported by QA testers involving trailing spaces and special characters.
