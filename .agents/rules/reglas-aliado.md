---
trigger: always_on
---

🔒 1. Reglas de Seguridad (OBLIGATORIAS)
- Nunca ejecutar acciones destructivas sin confirmación explícita (eliminar archivos, sobrescribir archivos críticos, resetear bases de datos).
- Antes de modificar múltiples archivos: mostrar lista de cambios propuestos.
- Nunca exponer claves API, tokens o credenciales.
- Validar rutas antes de escribir o modificar archivos.

🧠 2. Reglas de Decisión 
- No asumir información faltante. Si algo no está claro: preguntar antes de ejecutar.
- Clasificar cada cambio propuesto como: minor, backend, frontend, mobile, o full.
- Actuar en consecuencia y explicar brevemente la decisión.

⚙️ 3. Reglas de Desarrollo
- Antes de hacer cambios: analizar el contexto del proyecto y revisar archivos relacionados.
- No crear código duplicado.
- No modificar código sin entender su propósito original.
- Mantener consistencia con la arquitectura existente, naming conventions y la estructura del proyecto.

🚀 4. Reglas de Git (MUY IMPORTANTES)
- No hacer commit automáticamente sin validación previa del usuario.
- Antes de commit: verificar que el proyecto compile y que no haya errores críticos.
- Formato de commit obligatorio -> tipo: descripción breve. (Tipos permitidos: feat, fix, refactor, docs, chore).
- No hacer commits innecesarios o redundantes.

🏗️ 5. Reglas de Build y Deploy
- No generar builds innecesarios.
- Generar AAB: solo si hay cambios en el entorno mobile.
- Generar ZIP web: solo si hay cambios en el frontend.
- No desplegar si hay errores o el build falla.
- Exigir confirmación explícita antes de cualquier despliegue a producción.

💳 6. Reglas críticas para pagos (Stripe)
- Nunca confiar en el frontend para confirmar pagos.
- Usar siempre webhooks del backend como única fuente de verdad.
- No desbloquear funcionalidades premium sin confirmación validada del backend.
- Validar rigurosamente eventos de Stripe (firma e idempotencia).

🧾 7. Reglas de Documentación
- Después de cambios importantes, actualizar obligatoriamente: /documentation/CONTEXT.md (si cambia la lógica) y /documentation/10_CHANGELOG.md.
- No dejar cambios estructurales sin documentar.

🧪 8. Reglas de Validación
- Antes de finalizar cualquier tarea: verificar que lo implementado funciona lógicamente.
- Validar casos de uso básicos y reportar posibles errores.
- Si algo falla durante la validación: detener ejecución y explicar el problema.

📊 9. Reglas de Reporte 
- Al terminar cualquier tarea, generar un reporte con: tipo de cambio detectado, acciones realizadas, archivos modificados, si se generaron builds y el estado final.
- No dar por terminada la tarea sin proporcionar este resumen claro.

🧠 10. Regla MAESTRA (La más importante)
- Priorizar siempre: 1) Estabilidad del sistema, 2) Claridad del código, 3) Evitar errores en producción.
- Nunca optimizar prematuramente.
- Nunca hacer cambios innecesarios que no aporten valor directo a la tarea solicitada.