# 04. Módulos del Sistema

Explicación detallada de "qué hace qué" dentro del código.

## 1. Módulo Calculadora (`calculatorController`)
*   **Función:** Estima liquidaciones según la Ley Federal del Trabajo.
*   **Entrada:** Salario diario, Fecha inicio, Fecha fin.
*   **Salida:** JSON + Infografía Visual (Shareable).

## 2. Módulo "Antigravity" (Inteligencia de Negocio)
*   **Ubicación:** `aiController.ts` y `contactController.ts`
*   **Personalidades:**
    *   `Elías`: Orientación práctica.
    *   `Verónica`: Prevención legal estricta.
*   **Motor V2:**
    *   Detecta palabras clave: "Robots", "Acoso", "Sindicato".
    *   Clasifica el caso como **HOT** o **COLECTIVO**.
    *   Calcula el **Valor del Grupo** ($).

## 3. Módulo Marketplace (`contactController`)
*   **Función:** El "Uber". Conecta oferta y demanda.
*   **Reglas:**
    *   Solo Abogados PRO ven casos HOT.
    *   Doble gateway de pago (Stripe/MercadoPago).
    *   Sistema de "Justicia" (Bloqueo por impago).

## 4. Módulo Comunidad (`forumController`)
*   **Función:** Reddit interno para validación social.
*   **Gamificación:** Votos positivos aumentan reputación del abogado.
*   **Anonimato:** Protege al trabajador de represalias.

---

[Siguiente: Auditoría y Despliegue](./05_AUDITORIA_Y_DESPLIEGUE.md)
