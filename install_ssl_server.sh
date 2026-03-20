#!/bin/bash
# -------------------------------------------------------------
# Instalador Automático de SSL y Reverse Proxy Nginx
# Dominio: api.cibertmx.org -> Redirige localmente al puerto 3001
# -------------------------------------------------------------

echo "Empezando la instalación de Nginx y Certbot..."

# 1. Actualizar repositorios e instalar paquetes necesarios
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# 2. Habilitar Nginx en el firewall (UFW)
sudo ufw allow 'Nginx Full'

# 3. Crear archivo de configuración de Nginx
cat << 'EOF' > /etc/nginx/sites-available/api.cibertmx.org
server {
    listen 80;
    server_name api.cibertmx.org;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 4. Habilitar la configuración creando un enlace simbólico
sudo ln -s /etc/nginx/sites-available/api.cibertmx.org /etc/nginx/sites-enabled/

# 5. Probar que la configuración de Nginx no tenga errores de sintaxis
sudo nginx -t

# 6. Reiniciar Nginx para que tome los cambios
sudo systemctl restart nginx

# 7. Solicitar e instalar el certificado SSL gratuito
echo "Generando certificado SSL..."
# Nota: La bandera --non-interactive requiere un email.  
# Ejecutaremos la versión interactiva para que puedas poner tu correo oficial.
sudo certbot --nginx -d api.cibertmx.org

echo "--------------------------------------------------------"
echo "✅ Nginx y SSL instalados con éxito."
echo "--------------------------------------------------------"
echo "El servidor ahora está seguro y escuchando en https://api.cibertmx.org"
