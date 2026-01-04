# Configuración de Seguridad

## Encriptación de Tokens de Mercado Pago

Los tokens de acceso de Mercado Pago se guardan **encriptados** en la base de datos usando AES-256-GCM.

### Primera configuración (solo una vez)

1. **Generar clave de encriptación:**

```bash
npx tsx scripts/generate-encryption-key.ts
```

2. **Copiar la clave generada** (64 caracteres hexadecimales)

3. **Agregar a Vercel:**
   - Ir a: https://vercel.com/tu-proyecto/settings/environment-variables
   - Crear variable:
     - Name: `ENCRYPTION_KEY`
     - Value: `[la clave generada]`
     - Environments: ✅ Production, ✅ Preview, ✅ Development

4. **Redeploy la aplicación** en Vercel

### Variables de entorno requeridas

```env
# Mercado Pago OAuth
MP_CLIENT_ID=tu_client_id
MP_CLIENT_SECRET=tu_client_secret
MP_REDIRECT_URI=https://tu-dominio.vercel.app/api/callback

# Base de datos
DATABASE_URL=postgresql://...

# Encriptación (generar con scripts/generate-encryption-key.ts)
ENCRYPTION_KEY=clave_de_64_caracteres_hex
```

## ⚠️ Importante

- **NUNCA** compartas la `ENCRYPTION_KEY`
- **NUNCA** la subas a GitHub
- Si la perdés, **no podrás desencriptar** los tokens existentes
- Guardá una copia segura en un gestor de contraseñas

## Uso en el código

```typescript
import { encrypt, decrypt } from '../lib/encryption';

// Encriptar antes de guardar
const encryptedToken = encrypt(accessToken);
await sql`INSERT INTO clients (mp_access_token) VALUES (${encryptedToken})`;

// Desencriptar cuando se necesite usar
const client = await sql`SELECT mp_access_token FROM clients WHERE slug = ${slug}`;
const accessToken = decrypt(client[0].mp_access_token);

// Usar el token desencriptado
const response = await axios.post('https://api.mercadopago.com/...', {
  headers: { Authorization: `Bearer ${accessToken}` }
});
```
