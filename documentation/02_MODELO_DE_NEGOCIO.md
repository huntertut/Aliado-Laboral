# 02. Modelo de Negocio y Cobranza

**Versión:** 2.1 (Dinámico)

## Flujo de Dinero
El sistema cobra en dos momentos: **Inicio (Front)** y **Éxito (Back)**.

### A. Ingresos Recurrentes (Suscripciones)
Se cobran mensualmente vía Stripe para mantener el acceso.
*   **Trabajador Premium:** $29.00 MXN
*   **Abogado Basic:** $99.00 MXN
*   **Abogado PRO:** $299.00 MXN (Acceso a casos HOT)
*   **PyME Shield:** $999.00 MXN

### B. Ingresos por Operación (Lead Fees)
Se cobran al instante para conectar las partes.
*   **Fee de Contacto (Trabajador):** $50.00 MXN (Filtro anti-spam)
*   **Lead Standard (Abogado):** $150.00 MXN
*   **Lead HOT (Abogado):** $300.00 MXN

### C. Comisión por Éxito ("El Puente" Dinámico) 🌉
Se cobra automáticamente según el plan y el tipo de proceso.

| Nivel Abogado | Proceso | Tasa |
| :--- | :--- | :--- |
| **PRO** | Juicio | **5%** |
| **PRO** | Conciliación | **7%** |
| **BASIC** | Juicio | **8%** |
| **BASIC** | Conciliación | **10%** |

**Mecanismo:**
1.  Abogado sube foto del Convenio.
2.  OCR detecta monto.
3.  Sistema aplica la tasa correspondiente.
4.  Se genera Factura Stripe inmediata.
5.  **Bloqueo:** Si no paga en 5 días, pierde acceso a nuevos leads.

---

[Siguiente: Arquitectura Técnica](./03_ARQUITECTURA_TECNICA.md)
