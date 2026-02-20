# 🦅 Aliado Laboral: Manual Maestro del Sistema (V3.0)

**Fecha:** 25 de Enero, 2026
**Estado Técnica:** Producción (Verificada)
**Objetivo:** Democratizar la justicia laboral y monetizar mediante tecnología ética.

---

## 1. Visión General ("Uber de Justicia")
Aliado Laboral conecta a **Trabajadores Despedidos** con **Abogados Certificados** mediante un marketplace potenciado por IA.
*   **Trabajador:** Recibe cálculo de liquidación + orientación IA gratis. Paga $50 MXN para conectar.
*   **Abogado:** Paga suscripción ($99/$299) + costo por lead ($150/$300).
*   **PyME:** Paga suscripción ($999) para blindaje legal preventivo.

---

## 2. Modelo de Ingresos y Cobranza (V2.1 - Dinámico)

### A. Flujo "Front-Loaded" (Recurrente + Operativo)
| Concepto | Precio (MXN) | Frecuencia |
| :--- | :--- | :--- |
| Suscripción Abogado PRO | **$299.00** | Mensual |
| Suscripción Abogado Basic | **$99.00** | Mensual |
| Lead Fee (Caso HOT) | **$300.00** | Por caso aceptado |
| Lead Fee (Normal) | **$150.00** | Por caso aceptado |

### B. Flujo "El Puente" (Comisión por Éxito Variable)
Cobro automático tras ganar el caso (Sentencia/Convenio).

| Nivel Abogado | Proc. Juicio | Proc. Conciliación |
| :--- | :--- | :--- |
| **PRO** 🌟 | **5%** | **7%** |
| **BASIC** 😐 | **8%** | **10%** |

**Mecanismo de Cobro:**
1.  **Sube:** Abogado carga PDF a la Bóveda.
2.  **Detecta:** OCR lee el monto ganado.
3.  **Calcula:** Aplica la tasa según Tabla V2.1.
4.  **Factura:** Genera Stripe Invoice (5 días gracia).
5.  **Bloquea:** Si no paga, pierde acceso a Leads.

---

## 3. Arquitectura Técnica ("Antigravity Engine")

### Stack
*   **Frontend:** React Native (Expo).
*   **Backend:** Node.js + Express + Prisma.
*   **Base de Datos:** SQLite (Dev) / PostgreSQL (Prod).
*   **IA:** Groq (Llama 3-70b) para análisis de casos y "Personalidades" (Elías/Verónica).

### Módulos Críticos
1.  **Smart Calculator:** Estima liquidaciones exactas según LFT.
2.  **Legal Armor:** Enmascara datos del trabajador hasta que el abogado paga.
3.  **Gamification Guard:** Sistema de reputación que bloquea morosos.

---

## 4. Marco Legal y Fidelización

### Términos y Condiciones
*   **Obligatorio:** Checkbox en registro vincula al abogado a pagar las comisiones del 5-10%.
*   **Cláusula Bóveda:** Obligación contractual de subir sentencias.

### Fidelización (Efecto Dopamina)
*   **Ahorro Acumulado:** El sistema rastrea y notifica al Abogado PRO cuánto ha ahorrado *históricamente* en su perfil.
    > *"💰 Ahorro Acumulado: Tu suscripción PRO te ha ahorrado **$24,500 MXN** en total este año."*
    *Esto reduce el Churn Rate drásticamente.*

### Auditoría Social y Blindaje
*   **Worker Nudge:** Cuando el abogado marca "Ganado", el trabajador recibe: *"Tu abogado debe completar el cierre para que recibas tu expediente."* (Presión Social).
*   **Cláusula de Auditoría:** TyC permiten contactar al trabajador para verificar pagos "off-platform".
*   **Seguridad:** Aviso de Privacidad garantiza cifrado bancario para la Bóveda.

---

## 5. Sistemas de Continuidad y "Anti-Flojera" (V3.1)

### A. Sistema Nudge (4/7 Días)
*   **4 Días Inactividad:**
    *   ⚠️ **Abogado:** Recibe aviso *"El cliente espera noticias. Cuida tu reputación."*
    *   🤖 **Trabajador:** IA (Elías/Verónica) envía: *"Sigo monitoreando tu caso. He notificado a tu abogado."*
*   **7 Días Inactividad:**
    *   📉 **Abogado:** Pierde Puntos de Reputación y acceso a Leads HOT.

### B. Protocolo de Cancelación PRO (Rate Hike)
*   **Derechos Adquiridos:** Si un abogado cancela PRO, mantiene sus casos actuales.
*   **Cláusula de Continuidad:** Sin embargo, su tasa de Comisión por Éxito se ajusta **inmediatamente** a la tarifa vigente BASIC (10%/8%), incluso para casos iniciados siendo PRO.
    > *Incentivo:* "Renueva PRO para ahorrarte ese 3% extra."

**Nota para IAs Futuras:** Este documento (V3.1) es la fuente de verdad absoluta. Cualquier discrepancia con versiones anteriores, prevalece este archivo.

---

## 6. Resumen de Flujo Automatizado (Matriz de Reacción)
*Lógica de Negocio Hardcoded en Antigravity*

| Evento | Acción de Antigravity | Impacto Económico |
| :--- | :--- | :--- |
| **Inactividad 4 días** | IA envía mensaje de seguimiento + Nudge al Abogado. | Evita Churn (abandono) del usuario. |
| **Inactividad 7 días** | Nivel Rojo: Penaliza Reputación y bloquea Leads HOT. | Depura calidad del marketplace. |
| **Downgrade PRO -> Basic** | Actualiza tasa *future-proof* de 7% a 10% para cierres. | Aumenta margen por falta de lealtad. |
| **Suspensión Plan PyME** | Bloquea generación, activa "Solo Lectura". | Protege valor de suscripción recurrente. |

---
