# 02. Business Model

**Core Philosophy:** *"We only win when justice is served."*  
The business relies on a hybrid model combining the stability of SaaS with the scalability of a Marketplace.

---

## 1. Revenue Streams

### A. Recurring Subscriptions (SaaS)
Predictable revenue designed to cover operational costs and continuous development.

| Plan | Monthly Cost | Audience | Value Added |
| :--- | :--- | :--- | :--- |
| **Worker Premium** | **$29.00 MXN** | Worker | Priority queuing, unlimited AI Chatbot, ad-free experience. |
| **Lawyer Basic** | **$99.00 MXN** | Lawyer | Basic public profile, access to the severance calculator. |
| **Lawyer PRO** | **$299.00 MXN** | Lawyer | **Access to HOT Cases**, advanced CRM, highlighted profile. |
| **PyME Shield** | **$999.00 MXN** | Company | Continuous labor audits, unlimited legal documents, preventive advice. |

### B. Transactional Fees (Lead Generation)
Variable income tied to the volume of marketplace connections.

- **Worker Contact Fee:** **$50.00 MXN** (One-time fee per case).
  - *Purpose:* Validates real intent (anti-spam filter) and covers server costs.
- **Lawyer Lead Fee:** Paid by lawyers to unlock the contact details of a viable case.
  - **Standard Lead:** **$150.00 MXN**.
  - **HOT Lead:** **$300.00 MXN** (High-value cases >$150k MXN or collective lawsuits).

### C. Success Fees ("El Puente") 🌉
Automated commission on the total amount recovered in court or through conciliation. This is only charged if the worker wins the case.

| Lawyer Level | Resolution Type | Commission Rate |
| :--- | :--- | :--- |
| **PRO** | Trial (Juicio) | **5%** of recovered amount |
| **PRO** | Settlement (Conciliación) | **7%** of recovered amount |
| **BASIC** | Trial (Juicio) | **8%** of recovered amount |
| **BASIC** | Settlement (Conciliación) | **10%** of recovered amount |

---

## 2. Collection & Retention Mechanics

1. **Validation:** The AI system verifies the financial solvency of the case before offering it to the marketplace.
2. **Connection:** The lawyer pays the Lead Fee to unlock the worker's data.
3. **Tracking:** The internal CRM forces lawyers to log case milestones (lawsuit filed, hearing scheduled, award issued).
4. **Closing:** Upon winning, the lawyer must upload the final evidence (Settlement Agreement / Check).
5. **Collection:** Stripe automatically generates the success fee invoice.
   - *Security Lock:* If the invoice remains unpaid for 5 days, the lawyer's account is automatically suspended and flagged internally.

---

## 3. Financial Projections (Example Scenario)

- **Monthly Goal:** 1,000 Closed Cases.
- **Average Ticket (Severance):** $50,000 MXN.
- **Average Commission (7%):** $3,500 MXN.
- **Potential Revenue:** **$3.5M MXN per month** (Success Fees alone, excluding SaaS subscriptions and Lead Fees).
