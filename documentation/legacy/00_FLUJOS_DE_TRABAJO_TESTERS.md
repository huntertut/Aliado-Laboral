# Flujos de Trabajo Centrales - Aliado Laboral
> **Documento de Apoyo para Testers / QA**

Este documento visualiza los caminos (workflows) que deben recorrer los distintos roles de usuario dentro de la plataforma móvil para que puedan validar las reglas de negocio y los "Happy Paths".

---

## 👨‍🔧 1. Flujo del Trabajador (Worker Flow)

El objetivo principal de un trabajador es exponer su situación legal, encontrar abogados y eventualmente recibir asesoría mediante casos (tickets).

```mermaid
sequenceDiagram
    actor W as Trabajador (Worker)
    participant A as App Aliado
    participant DB as Servidor (Base de Datos)
    participant Stripe as Pasarela (Stripe)

    W->>A: Se registra (Email, Pass)
    A->>DB: Crea cuenta de Usuario "worker"
    Note over DB: Automatización: ¿Hay promo "Worker"?
    DB-->>A: Asigna Trial o Subscripción Inactiva
    W->>A: Llena su Perfil de Trabajador
    W->>A: Entra al "Buscar Abogados"
    W->>A: Escribe problema: "Despido injustificado..."

    Note over A, DB: Paywall de Suscripción (Si no hay Trial)

    alt Sin Suscripción Activa
        A->>W: Muestra Paywall ($29.00 / Mes)
        W->>Stripe: Paga con Tarjeta
        Stripe-->>DB: Webhook de Éxito
        DB-->>A: Habilita la Cuenta (Activa)
    end

    W->>A: Publica su "Caso" en el Foro
    DB->>DB: Almacena Caso (Abierto)
    A-->>W: Éxito. Esperar respuestas...
```

---

## 👩‍⚖️ 2. Flujo del Abogado (Lawyer Flow)

El abogado es el pilar de respuesta. Debe ser validado por el administrador antes de poder chatear y atraer clientes, y también paga una cuota de servicio.

```mermaid
sequenceDiagram
    actor L as Abogado (Lawyer)
    participant A as App Aliado
    participant Admin as Admin Web Panel
    participant DB as Servidor (Base de Datos)

    L->>A: Se registra (Email, Cédula)
    A->>DB: Crea cuenta "lawyer" (Estado: Pendiente)
    Note over DB: Promo "Lawyer": 30 Días Gratis
    DB-->>A: Asigna "Suscripción Trialing"

    L->>A: Llena especialidades (Familiar, Laboral, etc.)
    A->>L: Bloquea Chat: "Esperando Validación"

    %% Verificación Manual
    Admin->>DB: Revisa Cédulas en la Vista de Validación
    alt Cédula Falsa
        Admin->>DB: Marca como Rechazado
        DB-->>L: Notificación Push: Cuenta Rechazada
    else Cédula Real
        Admin->>DB: Aprueba Cuenta
        DB-->>L: Notificación Push: ¡Aprobado!
    end

    %% Operación Diaria
    L->>A: Entra al Foro de Casos de Trabajadores
    L->>A: Filtra casos por: Ubicación / Materia
    L->>A: Redacta una respuesta pública
    DB->>DB: Guarda respuesta y notifica al Trabajador
    L->>A: Inicia Chat Privado (Módulo de Chat)
```

## 🏢 3. Flujo PyME (Microempresa)
Las PyMEs interactúan para buscar asistencia masiva o auditorías legales. El proceso es más corporativo e incrusta un score de riesgo.

```mermaid
flowchart TD
    A([Registro PyME]) --> B[Ingreso de RFC / Razón Social]
    B --> C{Paywall Inicial / Promo}
    C -->|Paga / Active| D[Dashboard PyME]
    D --> E[Subir Archivos al Vault Corporativo]
    D --> F[Solicitar Abogado Especialista]
    F --> G[El Admin Web le asigna un Abogado Privado]
    G --> H([Flujo Cerrado: Chat 1 a 1 Activo])
```

## ⚠️ Casos y Manejo de Errores a Probar (QA Edge Cases)
Al hacer el testing de la versión 1.20, por favor verificar explícitamente estas rutas críticas:
1. **Contraseña Invalida:** Intentar poner "1234", ver que exige letras. Poner espacios en blanco finales y ver que ya no marcan error en la confirmación.
2. **Foro Congelado:** Verificar que si la suscripción de un abogado "Expira" (`status: inactive`), el sistema *bloquea el foro* y lo redirecciona inmediatamente al Paywall de Stripe.
3. **Pausas y Strikes:** Un administrador web le pone un "Strike" a un abogado por lenguaje inapropiado. El abogado debería ver la penalización reflejada en su pantalla de inicio en tiempo real.
4. **Easter Egg (Mantenimiento):** Tocar 7 veces el logo de Aliado (Página de Login) debe disparar la navegación al componente oculto para desarrolladores.
