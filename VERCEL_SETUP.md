# Configuración de Variables de Entorno en Vercel

Este documento explica cómo configurar las variables de entorno necesarias para que la aplicación funcione correctamente en Vercel.

## Variables de Entorno Requeridas

### 1. Autenticación (NextAuth.js)

#### `AUTH_SECRET` (OBLIGATORIO)
- **Descripción**: Secret para encriptar tokens y cookies de NextAuth
- **Cómo generarlo**:
  ```bash
  openssl rand -base64 32
  ```
- **Ejemplo**: `iAc+FOqu5cKmwwQRQe9NLA92S0c+sMfpm88mXtH6WXg=`

#### `NEXTAUTH_URL` (OBLIGATORIO en Vercel)
- **Descripción**: URL completa de tu aplicación desplegada
- **Valor para Vercel**: `https://nominatim-geocoder.vercel.app`
- **Nota**: Vercel establece automáticamente `VERCEL_URL`, pero NextAuth necesita la URL completa con protocolo

### 2. Google OAuth (OPCIONAL - si quieres habilitar SSO con Google)

#### `GOOGLE_CLIENT_ID`
- **Descripción**: Client ID de Google OAuth
- **Dónde obtenerlo**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- **Formato**: `xxxxxxxxx.apps.googleusercontent.com`

#### `GOOGLE_CLIENT_SECRET`
- **Descripción**: Client Secret de Google OAuth
- **Dónde obtenerlo**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

## Pasos para Configurar en Vercel

### Método 1: Dashboard de Vercel (Recomendado)

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Haz clic en **Settings** (Configuración)
3. En el menú lateral, selecciona **Environment Variables**
4. Agrega cada variable:
   - **Key**: Nombre de la variable (ej: `AUTH_SECRET`)
   - **Value**: Valor de la variable
   - **Environment**: Selecciona `Production`, `Preview`, y `Development` según necesites

### Método 2: Vercel CLI

```bash
# Instalar Vercel CLI (si no lo tienes)
npm i -g vercel

# Login en Vercel
vercel login

# Agregar variables de entorno
vercel env add AUTH_SECRET
vercel env add NEXTAUTH_URL
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
```

### Método 3: Archivo vercel.json (NO recomendado para secrets)

⚠️ **ADVERTENCIA**: No uses este método para secrets. Solo para configuración pública.

```json
{
  "env": {
    "NEXTAUTH_URL": "https://nominatim-geocoder.vercel.app"
  }
}
```

## Configuración Mínima (Solo Autenticación Local)

Si solo quieres usar autenticación con usuario/contraseña (sin Google SSO):

```env
AUTH_SECRET=tu-secret-generado-aqui
NEXTAUTH_URL=https://nominatim-geocoder.vercel.app
```

## Configuración Completa (Con Google SSO)

Para habilitar todas las funcionalidades incluyendo Google SSO:

```env
AUTH_SECRET=tu-secret-generado-aqui
NEXTAUTH_URL=https://nominatim-geocoder.vercel.app
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
```

## Verificar Configuración

Después de configurar las variables:

1. **Redeploy** tu aplicación en Vercel:
   - Dashboard: Settings > Deployments > ... > Redeploy
   - CLI: `vercel --prod`

2. **Verificar** que las variables estén configuradas:
   ```bash
   vercel env ls
   ```

3. **Probar** el login y logout:
   - Accede a `https://tu-app.vercel.app`
   - Deberías ser redirigido a `/login`
   - Inicia sesión con credenciales válidas
   - Prueba el botón "Cerrar Sesión" - debería redirigir a `/login` correctamente

## Solución de Problemas Comunes

### Error: "redirect to /undefined"

**Causa**: `NEXTAUTH_URL` no está configurado o tiene un valor incorrecto

**Solución**:
1. Verifica que `NEXTAUTH_URL` esté configurado en Vercel
2. El valor debe ser la URL completa: `https://tu-app.vercel.app`
3. Redeploy después de agregar/modificar la variable

### Error: "CSRF token mismatch"

**Causa**: `AUTH_SECRET` no está configurado o cambió entre deploys

**Solución**:
1. Genera un nuevo secret con `openssl rand -base64 32`
2. Configúralo en Vercel
3. Redeploy la aplicación

### Error: "Access blocked" (Google OAuth)

**Causa**: La URL de Vercel no está configurada en Google Cloud Console

**Solución**:
1. Ve a [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Edita tu OAuth client
3. Agrega a **Authorized redirect URIs**:
   - `https://tu-app.vercel.app/api/auth/callback/google`

## Diferencias entre Local y Vercel

| Variable | Local (.env.local) | Vercel (Production) |
|----------|-------------------|---------------------|
| `NEXTAUTH_URL` | `http://localhost:3002` | `https://tu-app.vercel.app` |
| `AUTH_SECRET` | Mismo valor | Mismo valor |
| `GOOGLE_CLIENT_ID` | Mismo valor | Mismo valor |
| `GOOGLE_CLIENT_SECRET` | Mismo valor | Mismo valor |

## Seguridad

✅ **Buenas prácticas**:
- Nunca commits secrets en el repositorio
- Usa diferentes secrets para development/production
- Regenera secrets periódicamente
- Usa variables de entorno de Vercel en lugar de archivos .env

❌ **Evita**:
- Guardar secrets en `vercel.json`
- Compartir secrets en mensajes o documentación
- Usar el mismo secret en múltiples proyectos

## Referencias

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Google OAuth Setup](./GOOGLE_OAUTH_SETUP.md)
