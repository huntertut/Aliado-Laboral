# Contexto del Equipo y Visión de Negocio

**Última actualización:** 16 de marzo de 2026

---

## Las Personas

| Persona | Rol |
|---|---|
| **Misael Morales Urbano** | Fundador principal, desarrollador, visionario del proyecto |
| **Miguel Ángel Rodríguez Romero** | Co-fundador de Save Company |
| *(3er miembro — pendiente de nombre)* | Parte del equipo fundador de CIBERT |

---

## Las Entidades (en proceso de formalización)

### 1. Save Company
- **Tipo:** Empresa privada (en proceso de constitución como S.A. de C.V. o similar)
- **Estado legal actual:** Operando informalmente / como personas físicas
- **Socios:** Misael Morales Urbano + Miguel Ángel Rodríguez Romero
- **Sede:** Oficina rentada (pequeña)
- **Freno actual:** Falta de flujo de efectivo para gastos notariales de constitución (~$15,000-$20,000 MXN)
- **Rol en el ecosistema:** Empresa de desarrollo y mantenimiento de software

### 2. CIBERT (ONG)
- **Tipo:** Organización No Gubernamental (ONG / Asociación Civil en proceso)
- **Estado legal actual:** En proceso de constitución
- **Miembros fundadores:** Al menos 3 personas (incluyendo Misael)
- **Misión general:** (Pendiente de definir formalmente, vinculada a tecnología y educación)
- **Objetivo financiero:** Acceder a fondos de apoyo gubernamentales, privados o internacionales (grants, donativos)
- **Rol en el ecosistema:** Dueña formal de la app "Aliado Laboral" y generadora del flujo financiero inicial

### 3. Aliado Laboral (El Producto)
- **Tipo:** Aplicación móvil + plataforma web
- **Propiedad:** Pertenecería a CIBERT
- **Propósito comercial:** Generar ingresos recurrentes (suscripciones de abogados, compra de leads, success fees)
- **Tecnología:** React Native (iOS/Android), Node.js backend, React Web (panel admin)
- **Estado:** En desarrollo activo, en proceso de aprobación en Google Play

---

## El Modelo de Negocio Propuesto (Arquitectura Financiera)

```
USUARIOS DE ALIADO LABORAL
         |
         | (pagos: suscripciones, leads, success fees)
         ▼
    ┌──────────┐
    │  CIBERT  │  ← Propietaria de Aliado Laboral
    │  (ONG)   │  ← Recibe los ingresos de la app
    └────┬─────┘
         |
         | Contrato de desarrollo y mantenimiento
         | (paga una cuota mensual a Save Company)
         ▼
    ┌─────────────────┐
    │  Save Company   │  ← Empresa de software (Misael + Miguel)
    │  (desarrollador)│  ← Recibe honorarios por servicio
    └────┬────────────┘
         |
         | Nómina / Honorarios
         ▼
    Misael Morales Urbano
    (percibe ingresos de AMBAS entidades)
```

### Flujo de Ingresos para Misael:
1. **Como miembro de CIBERT:** Salario / compensación de la ONG (legal si está definido en los estatutos)
2. **Como socio/empleado de Save Company:** Salario o dividendos por el contrato de desarrollo

---

## Análisis del Modelo ✅❌

### Lo que está bien
- ✅ **Es viable en México.** Las ONGs / Asociaciones Civiles SÍ pueden tener actividades lucrativas siempre que los excedentes se reinviertan en la misión social.
- ✅ **Doble ingreso para los fundadores** es una estrategia clásica en startups tempranas.
- ✅ **El contrato CIBERT → Save Company** es una figura completamente normal (outsourcing de desarrollo).
- ✅ **Los grants o fondos para ONGs** (INDESO, CONACYT/CONAHCYT, fondos internacionales de tecnología social) son una fuente real de capital semilla.

### Puntos a tener en cuenta
- ⚠️ **La ONG no puede tener fines de lucro directo.** El 100% de excedentes de la app deben reinvertirse en la misión de CIBERT, no distribuirse como dividendos. Los salarios sí están permitidos.
- ⚠️ **El contrato inter-empresa debe ser a precio de mercado.** La cuota que CIBERT le pague a Save Company debe ser razonable y comparable a lo que cobraría cualquier otra empresa de desarrollo (para evitar conflictos de interés ante el SAT o el INAI).
- ⚠️ **Necesitan constituir CIBERT primero** antes que Save Company si quieren seguir el modelo tal cual, porque CIBERT sería la entidad propietaria del activo principal (la app).
- ⚠️ **Misael debe declarar ambas fuentes de ingreso** al SAT (régimen de sueldos + honorarios / dividendos según corresponda).

---

## Siguiente Paso Recomendado (según el equipo)
1. Constituir CIBERT como A.C. formalmente (costo notarial ~$8,000-$15,000 MXN)
2. Lanzar Aliado Laboral en Play Store (en progreso ✅)
3. Con primeros ingresos, constituir Save Company
4. Formalizar el contrato de servicios entre CIBERT y Save Company
