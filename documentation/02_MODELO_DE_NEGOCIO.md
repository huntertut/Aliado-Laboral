# 02. Modelo de Negocio: Sostenibilidad y Crecimiento

**Filosofía:** "Ganamos solo cuando se hace justicia".
Un modelo híbrido que combina estabilidad (SaaS) con escalabilidad (Marketplace).

---

## 1. Fuentes de Ingreso (Revenue Streams)

### A. Suscripciones Recurrentes (SaaS)
Ingresos predecibles que cubren costos operativos y desarrollo.

| Plan | Costo Mensual | Público | Valor Agregado |
| :--- | :--- | :--- | :--- |
| **Worker Premium** | **$29.00 MXN** | Trabajador | Prioridad en fila, Chatbot ilimitado, Sin anuncios. |
| **Lawyer Basic** | **$99.00 MXN** | Abogado | Perfil público básico, Acceso a calculadora. |
| **Lawyer PRO** | **$299.00 MXN** | Abogado | **Acceso a Casos HOT**, CRM avanzado, Perfil destacado. |
| **PyME Shield** | **$999.00 MXN** | Empresa | Auditoría continua, Docs ilimitados, Asesoría preventiva. |

### B. Tarifas por Operación (Transactional)
Ingresos variables ligados al volumen de casos.

*   **Fee de Contacto (Trabajador):** **$50.00 MXN** (Pago único por caso).
    *   *Propósito:* Validar interés real (filtro anti-spam) y cubrir costos de servidores.
*   **Lead Fee (Abogado):** Pago por desbloquear datos de contacto de un caso viable.
    *   **Standard:** **$150.00 MXN**.
    *   **HOT:** **$300.00 MXN** (Casos de alto valor >$150k o colectivos).

### C. "El Puente" Dinámico (Success Fee) 🌉
Comisión automatizada sobre el monto recuperado en juicio o conciliación. Solo aplica si el trabajador gana.

| Nivel Abogado | Proceso | Tasa de Comisión |
| :--- | :--- | :--- |
| **PRO** | Juicio | **5%** del monto recuperado |
| **PRO** | Conciliación | **7%** del monto recuperado |
| **BASIC** | Juicio | **8%** del monto recuperado |
| **BASIC** | Conciliación | **10%** del monto recuperado |

---

## 2. Mecánica de Cobro y Retención

1.  **Validación:** El sistema verifica la solvencia del caso antes de ofrecerlo.
2.  **Conexión:** El abogado paga el Lead Fee para contactar al trabajador.
3.  **Seguimiento:** El CRM obliga a registrar hitos (demanda presentada, audiencia, laudo).
4.  **Cierre:** Al ganar, el abogado sube la evidencia (Convenio/Cheque).
5.  **Cobro:** Stripe genera la factura de la comisión automáticamente.
    *   *Candado:* Si la factura no se paga en 5 días, la cuenta del abogado se suspende y se boletina en el Buró Legal interno.

---

## 3. Proyecciones (Ejemplo)

*   **Meta Mensual:** 1,000 Casos Cerrados.
*   **Ticket Promedio (Liquidación):** $50,000 MXN.
*   **Comisión Promedio (7%):** $3,500 MXN.
*   **Ingreso Potencial:** $3.5M MXN (solo por Success Fee, sin contar suscripciones).

---

[Siguiente: Arquitectura Técnica](./03_ARQUITECTURA_TECNICA.md)
