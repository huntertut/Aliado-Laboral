# 🛠️ Aliado Laboral - Development Tools

Estos scripts automatizan el proceso de compilación y mantenimiento.
Úsalos en el orden numerado según lo necesites.

## 🚀 Flujo Diario

### **`00_monitor_logs.bat`**
- **Uso:** Siempre tenlo abierto en una terminal secundaria.
- **Función:** Te muestra errores de JavaScript y caídas de la app en tiempo real.

### **`01_build_android.bat`**
- **Uso:** Tu herramienta principal. Úsala para compilar la app.
- **Función:**
  - Copia el proyecto a una carpeta segura (`C:\rn_safe_build`) para evitar errores de rutas largas de Windows.
  - Instala dependencias.
  - Aplica parches.
  - Genera el APK y lo instala en el emulador.

---

## 🧹 Mantenimiento y Emergencias

### **`98_clean_cache.bat`**
- **Uso:** Una vez a la semana o si la app se comporta extraño.
- **Función:** Borra cachés temporales de Gradle y compilación.

### **`99_hard_reset.bat`** (Opción Nuclear)
- **Uso:** Solo cuando nada más funcione (ej. "Pantalla Blanca" persistente).
- **Función:** Destruye completamente las carpetas de compilación. Obliga a Android a recompilar cada archivo desde cero.

---

## 📂 Archivos Auxiliares
- `patch_rn.ps1`: Script interno de PowerShell para corregir incompatibilidades con NDK r26.
