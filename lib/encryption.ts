// Librería de encriptación para tokens sensibles
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// Algoritmo de encriptación (AES-256-GCM es estándar de grado militar)
const ALGORITHM = 'aes-256-gcm';

// Obtener la clave de encriptación desde variables de entorno
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY no está configurada en las variables de entorno');
  }

  // La clave debe ser de 32 bytes (64 caracteres hex)
  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY debe tener 64 caracteres hexadecimales (32 bytes)');
  }

  return Buffer.from(key, 'hex');
}

/**
 * Encripta un string sensible (como un access token)
 * Retorna: iv:authTag:encryptedData (todo en hex)
 */
export function encrypt(text: string): string {
  if (!text) return '';

  const key = getEncryptionKey();

  // Generar IV (Initialization Vector) aleatorio de 12 bytes
  const iv = randomBytes(12);

  // Crear cipher
  const cipher = createCipheriv(ALGORITHM, key, iv);

  // Encriptar
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Obtener authentication tag (para verificar integridad)
  const authTag = cipher.getAuthTag();

  // Retornar: iv:authTag:encryptedData (todo separado por :)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Desencripta un string encriptado
 * Espera formato: iv:authTag:encryptedData
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';

  const key = getEncryptionKey();

  // Separar IV, authTag y datos encriptados
  const parts = encryptedText.split(':');

  if (parts.length !== 3) {
    throw new Error('Formato de datos encriptados inválido');
  }

  const [ivHex, authTagHex, encryptedData] = parts;

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  // Crear decipher
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  // Desencriptar
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Genera una nueva clave de encriptación de 32 bytes (para usar una sola vez)
 * Ejecutar esto y guardar el resultado en ENCRYPTION_KEY en Vercel
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex');
}
