# Ecuador Parapente — Invitaciones digitales

Aplicación React + Express + PostgreSQL para generar vales de regalo personalizados para vuelos en parapente en Montañita. Cada vale recibe un UUID privado y una URL pública (`/invitacion/{codigo}`). El código nunca aparece visualmente en la tarjeta.

## Desarrollo local

1. Instala Node.js 20+ y PostgreSQL 14+.
2. Crea una base y un usuario:
   ```sql
   CREATE USER parapente_user WITH PASSWORD 'una-contrasena-segura';
   CREATE DATABASE ecuador_parapente OWNER parapente_user;
   ```
3. Copia `server/.env.example` como `server/.env` y edita sus valores.
4. Instala dependencias y prepara la tabla:
   ```bash
   npm install
   npm run install:all
   npm run migrate --prefix server
   npm run dev
   ```
5. Abre `http://localhost:5173`.

## Fotos HEIC

Los originales de la operadora están en `client/src/assets/*.heic`. Los navegadores no los muestran de manera consistente: conviértelos a JPG antes de compilar y cópialos al directorio `client/public/images/` con estos nombres: `flight-1.jpg`, `flight-2.jpg`, `flight-3.jpg`.

En macOS puedes usar `sips`; en Ubuntu instala `libheif-examples` y ejecuta:
```bash
mkdir -p client/public/images
heif-convert client/src/assets/flight-1.heic client/public/images/flight-1.jpg
heif-convert client/src/assets/flight-2.heic client/public/images/flight-2.jpg
heif-convert client/src/assets/flight-3.heic client/public/images/flight-3.jpg
```

## Despliegue en Google Cloud VPS (Ubuntu)

1. Copia el proyecto a `/var/www/ecuador-parapente` y ejecuta `npm run install:all` y `npm run build`.
2. Crea la base PostgreSQL como se indicó arriba. Configura `/var/www/ecuador-parapente/server/.env`; define `PUBLIC_URL=https://tudominio.com` y `CLIENT_ORIGIN=https://tudominio.com`.
3. Ejecuta la migración: `npm run migrate --prefix server`.
4. Instala y activa el servicio:
   ```bash
   sudo cp deploy/ec-parapente-api.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now ec-parapente-api
   ```
5. Copia `deploy/nginx-ecuador-parapente.conf` a `/etc/nginx/sites-available/ecuador-parapente`, reemplaza el dominio, crea el enlace en `sites-enabled` y valida con `sudo nginx -t && sudo systemctl reload nginx`.
6. Habilita HTTPS: `sudo certbot --nginx -d tudominio.com -d www.tudominio.com`.

Para usar PM2 en vez de systemd: `npm i -g pm2`, luego `pm2 start server/src/index.js --name ecuador-parapente` y `pm2 save`.

## API

- `POST /api/invitations`: crea una invitación. Requiere `clientName` y `flightDate`.
- `GET /api/invitations/:code`: devuelve la invitación pública.
- `GET /api/invitations`: lista las invitaciones (recomiendo protegerlo con autenticación antes de usarlo en producción).

> Importante: antes de lanzar el sitio, protege el endpoint de listado y el panel de creación con una contraseña o autenticación de usuarios. La API valida tipos y longitudes, usa UUID y consultas parametrizadas, pero esa capa de acceso corresponde al entorno de la operadora.
