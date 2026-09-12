# Guía de Implementación - Sistema de Aprobación Digital RSA-2048

## 📋 Tabla de Contenidos

1. [Preparación](#preparación)
2. [Instalación](#instalación)
3. [Configuración](#configuración)
4. [Generación de Claves](#generación-de-claves)
5. [Testing](#testing)
6. [Despliegue](#despliegue)
7. [Operación](#operación)

---

## 🔧 Preparación

### Requisitos del Sistema

```bash
# Verificar versión de Node.js (16+ requerido)
node --version    # debe ser v16.0.0 o superior

# Verificar npm
npm --version     # debe ser 7+ o superior

# SQLite3 debe estar instalado
sqlite3 --version
```

### Permisos de Seguridad

El usuario que ejecuta el sistema debe tener:
- ✓ Lectura/Escritura en directorio `./keys/`
- ✓ Lectura/Escritura en directorio `./data/` o donde esté BD
- ✓ Acceso a puerto 3001 (u otro configurado)
- ✓ Certificado SSL/TLS si se ejecuta en producción

---

## 📦 Instalación

### 1. Descargar Código

```bash
git clone https://github.com/tu-usuario/digital-signature-system.git
cd digital-signature-system
```

### 2. Instalar Dependencias

```bash
npm install
```

**Dependencias principales**:
- `express`: Framework web
- `sqlite3`: Base de datos
- `cors`: Soporte CORS
- `typescript`: Tipado estático

### 3. Compilar TypeScript

```bash
npm run build
```

Genera archivos en carpeta `./dist/`

### 4. Verificar Instalación

```bash
npm run build:check
```

O verificar manualmente:
```bash
ls -la dist/
# Debe mostrar: server.js, crypto/, db/, api/
```

---

## ⚙️ Configuración

### Variables de Entorno

Crear archivo `.env`:

```bash
# Puerto de servidor
PORT=3001

# Base de datos
DB_PATH=./transactions.db
DB_TYPE=sqlite3

# Claves criptográficas
KEYS_DIR=./keys

# Síndico
SINDICO_NAME=Omar
SINDICO_EMAIL=omar@example.com

# Seguridad
REQUIRE_2FA=true
LOG_ALL_TRANSACTIONS=true
AUDIT_RETENTION_DAYS=2555  # 7 años

# SSL/TLS (producción)
SSL_ENABLED=false
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
```

### Cargar Variables

```bash
# Crear archivo .env en raíz del proyecto
nano .env

# Verificar carga
source .env
echo $PORT
```

---

## 🔑 Generación de Claves

### Paso 1: Generar Claves RSA-2048 del Síndico

```bash
npm run generate-keys
```

**Salida esperada**:
```
✓ Claves RSA-2048 generadas para síndico-omar-main
✓ Clave privada: guardada en ./keys/sindico-omar-main.json
✓ Thumbprint (público): a1b2c3d4e5f6g7h8
✓ Vencimiento: 2025-09-12
```

### Paso 2: Verificar Claves Generadas

```bash
ls -la keys/
# Debe mostrar: sindico-omar-main.json

cat keys/sindico-omar-main.json
# Mostrará estructura de clave (primeros 50 caracteres públicos, privada completa)
```

### Paso 3: Hacer Backup de Claves

**⚠️ CRÍTICO - SEGURIDAD:**

```bash
# Crear backup encriptado de clave privada
# NUNCA guardar en Git o repositorio público

mkdir -p backups/
cp keys/sindico-omar-main.json backups/sindico-omar-main.json.backup

# Encriptar con GPG (recomendado)
gpg --symmetric backups/sindico-omar-main.json.backup
# Introduce contraseña de seguridad
```

### Paso 4: Configurar Rotación de Claves

En archivo `./scripts/rotate-keys.ts`:

```typescript
// Ejecutar cada 365 días
const expirationDate = new Date('2025-09-12');
const daysUntilExpiration = Math.ceil(
  (expirationDate - new Date()) / (1000 * 60 * 60 * 24)
);

if (daysUntilExpiration < 30) {
  console.log('⚠️  Clave vence en ' + daysUntilExpiration + ' días');
  console.log('Ejecutar rotación de clave: npm run rotate-keys');
}
```

---

## 🧪 Testing

### Test 1: Verificar Servidor

```bash
npm run dev
```

**Salida esperada**:
```
✓ Servidor iniciado en puerto 3001
✓ Endpoints disponibles
✓ Base de datos inicializada
```

Abrir en navegador: `http://localhost:3001/`

### Test 2: Generar Transacción de Prueba

```bash
# En terminal nueva
curl -X POST http://localhost:3001/api/transactions/create \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "currency": "EUR",
    "description": "Transacción de prueba",
    "signatory": "Omar"
  }'
```

**Respuesta esperada**:
```json
{
  "success": true,
  "transaction": {
    "transactionId": "TXN-1234567890-a1b2c3d4",
    "status": "PENDING"
  }
}
```

### Test 3: Obtener Transacciones Pendientes

```bash
curl http://localhost:3001/api/transactions/pending
```

### Test 4: Aprobar Transacción (Síndico Firma)

```bash
curl -X POST http://localhost:3001/api/transactions/TXN-1234567890-a1b2c3d4/approve \
  -H "Content-Type: application/json" \
  -d '{
    "keyId": "sindico-omar-main",
    "signatoryId": "Omar"
  }'
```

### Test 5: Ejecución Completa

```bash
npm run demo
```

Ejecuta flujo completo:
1. ✓ Crea transacción €5,000
2. ✓ Síndico firma digitalmente
3. ✓ Verifica firma RSA-2048
4. ✓ Ejecuta transacción
5. ✓ Genera auditoría

---

## 🚀 Despliegue

### Despliegue Local

```bash
# Compilar
npm run build

# Iniciar servidor
npm start
```

Acceso: `http://localhost:3001`

### Despliegue en Servidor (Linux/Ubuntu)

#### 1. Preparar Servidor

```bash
# SSH al servidor
ssh user@server.com

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Crear usuario específico
sudo useradd -m -s /bin/bash sigapp
sudo su - sigapp
```

#### 2. Clonar y Configurar

```bash
# Descargar código
git clone https://github.com/tu-usuario/digital-signature-system.git
cd digital-signature-system

# Instalar dependencias
npm install --production

# Compilar
npm run build

# Configurar variables de entorno
nano .env
# (establecer PORT=3001, rutas, etc.)
```

#### 3. Configurar PM2 (Process Manager)

```bash
# Instalar PM2
sudo npm install -g pm2

# Crear configuración
nano ecosystem.config.js
```

**Contenido `ecosystem.config.js`**:
```javascript
module.exports = {
  apps: [{
    name: 'digital-signature-api',
    script: './dist/server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log'
  }]
};
```

#### 4. Iniciar con PM2

```bash
pm2 start ecosystem.config.js

# Guardar configuración
pm2 save

# Configurar startup automático
pm2 startup
pm2 save
```

#### 5. Configurar Nginx (Reverse Proxy)

```bash
sudo nano /etc/nginx/sites-available/sigapp
```

**Contenido**:
```nginx
upstream sigapp {
  server 127.0.0.1:3001;
}

server {
  listen 80;
  server_name sigapp.example.com;

  # Redirect HTTP a HTTPS
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name sigapp.example.com;

  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;

  location / {
    proxy_pass http://sigapp;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

#### 6. Activar Nginx

```bash
sudo ln -s /etc/nginx/sites-available/sigapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🎯 Operación

### Inicio de Servidor

```bash
# Desarrollo
npm run dev

# Producción
npm start

# Con PM2
pm2 start ecosystem.config.js
pm2 logs digital-signature-api
```

### Monitoreo

```bash
# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs

# Reiniciar
pm2 restart digital-signature-api

# Detener
pm2 stop digital-signature-api
```

### Transacciones Diarias

#### Para Síndico (Omar)

1. **Revisar Pendientes**
   ```bash
   curl http://localhost:3001/api/transactions/pending
   ```

2. **Revisar Detalles**
   ```bash
   curl http://localhost:3001/api/transactions/TXN-xxxxx
   ```

3. **Aprobar y Firmar**
   ```bash
   curl -X POST http://localhost:3001/api/transactions/TXN-xxxxx/approve \
     -H "Content-Type: application/json" \
     -d '{"keyId":"sindico-omar-main"}'
   ```

4. **Ejecutar**
   ```bash
   curl -X POST http://localhost:3001/api/transactions/TXN-xxxxx/execute
   ```

5. **Auditoría**
   ```bash
   curl http://localhost:3001/api/audit/TXN-xxxxx
   ```

### Backup y Recuperación

#### Backup Diario

```bash
#!/bin/bash
# backup.sh - Ejecutar diariamente con cron

BACKUP_DIR="./backups/$(date +%Y-%m-%d)"
mkdir -p $BACKUP_DIR

# Backup de base de datos
cp transactions.db $BACKUP_DIR/transactions.db.backup

# Backup de claves (encriptado)
gpg --symmetric keys/sindico-omar-main.json
cp keys/sindico-omar-main.json.gpg $BACKUP_DIR/

# Archivo de log
cp logs/*.log $BACKUP_DIR/ 2>/dev/null || true

echo "✓ Backup completado: $BACKUP_DIR"
```

**Configurar Cron**:
```bash
crontab -e
# Agregar línea: 0 2 * * * /path/to/backup.sh
```

#### Recuperación

```bash
# Si BD se corrupta
cp backups/2024-09-12/transactions.db.backup transactions.db

# Si se pierde clave
gpg backups/2024-09-12/sindico-omar-main.json.gpg
# Introduce contraseña
cp sindico-omar-main.json keys/
```

---

## 📊 Health Check

### Script de Verificación

```bash
#!/bin/bash
# health-check.sh

echo "🔍 Verificando Sistema de Firma Digital..."

# 1. Verificar servidor ejecutándose
SERVER_STATUS=$(curl -s http://localhost:3001/api/health | jq .status)
if [ "$SERVER_STATUS" = '"ok"' ]; then
  echo "✓ Servidor: OK"
else
  echo "✗ Servidor: OFFLINE"
  exit 1
fi

# 2. Verificar base de datos
DB_SIZE=$(du -sh transactions.db | cut -f1)
echo "✓ BD: $DB_SIZE"

# 3. Verificar claves
if [ -f "keys/sindico-omar-main.json" ]; then
  echo "✓ Claves: Presentes"
else
  echo "✗ Claves: NO encontradas"
  exit 1
fi

# 4. Verificar logs
RECENT_LOGS=$(tail -5 logs/out.log)
echo "✓ Logs recientes: OK"

echo "✓ Sistema LISTO"
```

---

## ⚠️ Seguridad Operacional

### Checklist de Seguridad

- [ ] Claves privadas solo en servidor seguro
- [ ] Backups encriptados en ubicación segura
- [ ] SSL/TLS en producción
- [ ] Firewall configuro (solo acceso autorizado)
- [ ] Logs monitoreados
- [ ] Rotación de claves cada 365 días
- [ ] Auditoría externa anual
- [ ] Plan de continuidad de negocio
- [ ] Procedimiento de incidente documentado

---

## 📞 Soporte

**Para problemas**: omsortiz.uk1@outlook.com

---

**Última actualización**: Septiembre 2024
