# 📘 Manual de Resurrección SSL y Moodle para Servidor CentOS / CWP (Actualizado y Completo)

Este manual resuelve el ciclo oscuro donde CWP falla en la instalación del SSL, Apache arroja Pantallas Azules (Test Page) o Errores de Sintaxis, y Moodle entra en un bucle de Error 500, Pantalla Blanca de Redirección o 403 Forbidden.

### FASE 1: Inyección Forzada del Certificado Let's Encrypt (Desde Consola SSH)
*Cuando el panel gráfico de CWP falla al generar el AutoSSL rojo, lo hacemos nacer a la fuerza con el instalador nativo.*

**1. Generar el Certificado (Sustituye TUDOMINIO por el de la escuela):**
```bash
/root/.acme.sh/acme.sh --issue -d TUDOMINIO.com -w /home/savecom/public_html/CARPETA_DEL_DOMINIO --force
```
*(Debes recibir letras verdes que digan `Cert success`)*

**2. Instalar el Certificado en las rutas físicas de Apache CWP:**
```bash
/root/.acme.sh/acme.sh --install-cert -d TUDOMINIO.com \
--cert-file /etc/pki/tls/certs/TUDOMINIO.com.cert \
--key-file /etc/pki/tls/private/TUDOMINIO.com.key \
--fullchain-file /etc/pki/tls/certs/TUDOMINIO.com.bundle
```

---

### FASE 2: Purgar los Duplicados de CWP (Evitando que Apache rechace la conexión)
*CWP tiene el "Bug Clonador" donde repite la configuración SSL 4 o 5 veces. Esto hace que Apache ignore el VirtualHost por seguridad y te muestre Chrome con `ERR_CONNECTION_REFUSED` o `NET::ERR_CERT_COMMON_NAME_INVALID` mostrando el certificado de la página principal (savecompanymx.com).*

**1. Abrir el mapa de configuración cifrada del dominio en específico:**
```bash
nano /usr/local/apache/conf.d/vhosts/TUDOMINIO.com.ssl.conf
```
**2. Limpiar la Basura:**
Baja con las flechas hasta ubicar la línea `SSLEngine on`. Verás que las líneas de abajo (`SSLCertificateFile`, `SSLCertificateKeyFile`, etc.) se repiten muchísimas veces en bloques.
Usa **`Ctrl + K`** para borrar los renglones repetidos. Deja **ÚNICAMENTE UN BLOQUE LIMPIO**, que se vea así:
```apache
SSLEngine on
SSLCertificateFile /etc/pki/tls/certs/TUDOMINIO.com.cert
SSLCertificateKeyFile /etc/pki/tls/private/TUDOMINIO.com.key
SSLCertificateChainFile /etc/pki/tls/certs/TUDOMINIO.com.bundle
```

**3. Guardar el archivo limpio:** 
`Ctrl + O`, luego `Enter`, luego `Ctrl + X`.

---

### FASE 3: Matar al Zombi y Reiniciar Apache correctamente
*Si usas solo `systemctl restart httpd`, el servidor base de CentOS se asusta e intenta arrancar un Apache basura nativo que roba los puertos 80/443 mostrando la "CentOS Test Page" y bloqueando todo tu CWP. Nunca uses ese comando.*

**1. Destruir procesos falsos "enganchados" al puerto 80/443:**
```bash
systemctl stop httpd
killall -9 httpd
```

**2. Iniciar el Motor Inteligente y oficial de CWP:**
```bash
/usr/local/apache/bin/apachectl start
```

---

### FASE 4: Curar el "Internal Server Error 500" o "403 Forbidden" (suPHP)
*Si la conexión HTTPS ya carga pero te muestra Error 500 o 403, significa que los archivos que subiste por FTP están legalmente a nombre de "apache" (UID 48) o "root", y el servidor estricto protector "suPHP" bloquea la puerta y ejecución.*

**1. Alinear el dueño legal de los archivos del proyecto (Reemplaza con tu carpeta):**
```bash
chown -R savecom:savecom /home/savecom/public_html/CARPETA_DEL_DOMINIO
chmod -R 755 /home/savecom/public_html/CARPETA_DEL_DOMINIO
```

---

### FASE 5: Romper los Bucles Infinitos de Moodle (`dataroot` y redirecciones)
*Moodle necesita re-configurarse para HTTPS, o te tirará `fatal error` o bucles ciegos.*

**1. Arreglar el fatal error de Permisos de Dataroot (Caja Fuerte blindada):**
Si Moodle explota diciendo `$CFG->dataroot is not writable`, dedícale el mismo tratamiento global a sus carpetas de datos ocultas:
```bash
chown -R savecom:savecom /home/savecom/public_html/moodledata*
chmod -R 755 /home/savecom/public_html/moodledata*
```

**2. Curar el Bucle Infinito de wwwroot (Demasiadas Redirecciones):**
Busca la configuración núcleo de tu Moodle:
```bash
nano /home/savecom/public_html/CARPETA_DEL_DOMINIO/config.php
```
Busca la variable `$CFG->wwwroot` y asegúrate de que cambie de `http://...` a decir **EXACTAMENTE** su URL oficial verde, sin subcarpetas extra:
```php
$CFG->wwwroot = 'https://TUDOMINIO.edu.mx';
```

---

### FASE 6: Curar el "404 Not Found" y carpetas vacías (DocumentRoot Perdido)
*Frecuentemente el autogenerador de CWP crea el dominio pero olvida apuntar el láser hacia la carpeta real, poniéndole un nombre corto incompleto (ej: `/esqueda` en lugar de `/esqueda.edu.mx`) o dejándolo tirado en el `/public_html` suelto. Esto provoca que cargue la lista vacía de Index Of o un 404.*

**1. Abre el archivo de configuración afectado:**
```bash
nano /usr/local/apache/conf.d/vhosts/TUDOMINIO.com.ssl.conf
```

**2. Corrige el apuntador (`DocumentRoot` y `<Directory>`):**
Modifica estrictamente las rutas de esas dos líneas principales para que apunten físicamente a la subcarpeta inmensa real donde guardaste tu código en FTP.
*Ejemplo Correcto:*
```apache
DocumentRoot /home/savecom/public_html/higeo.esqueda.edu.mx
<Directory "/home/savecom/public_html/higeo.esqueda.edu.mx">
```
*Guarda con `Ctrl+O`, `Enter`, `Ctrl+X` y remata con la **FASE 3** para encender Apache.*
