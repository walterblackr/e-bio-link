// Script para generar clave de encriptación
// Uso: npx tsx scripts/generate-encryption-key.ts

import { generateEncryptionKey } from '../lib/encryption';

console.log('🔐 Generando clave de encriptación...\n');

const key = generateEncryptionKey();

console.log('✅ Clave generada exitosamente:\n');
console.log(`ENCRYPTION_KEY=${key}\n`);

console.log('📋 Instrucciones:\n');
console.log('1. Copiá esta clave');
console.log('2. Andá a Vercel Dashboard → Settings → Environment Variables');
console.log('3. Agregá una nueva variable:');
console.log('   - Name: ENCRYPTION_KEY');
console.log(`   - Value: ${key}`);
console.log('   - Environments: Production, Preview, Development');
console.log('4. Redeploy tu aplicación\n');

console.log('⚠️  IMPORTANTE:');
console.log('   - Guardá esta clave en un lugar seguro');
console.log('   - NO la compartas con nadie');
console.log('   - NO la subas a GitHub');
console.log('   - Si la perdés, no podrás desencriptar los tokens existentes\n');
