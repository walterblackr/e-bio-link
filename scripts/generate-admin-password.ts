// Script para generar hash de contraseña de admin
// Uso: npx tsx scripts/generate-admin-password.ts <contraseña>

import bcrypt from 'bcryptjs';

async function generatePasswordHash(password: string) {
  if (!password) {
    console.error('❌ Error: Debes proporcionar una contraseña');
    console.log('Uso: npx tsx scripts/generate-admin-password.ts <contraseña>');
    process.exit(1);
  }

  console.log('🔐 Generando hash de contraseña...\n');

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  console.log('✅ Hash generado exitosamente:\n');
  console.log(`Contraseña: ${password}`);
  console.log(`Hash: ${hash}\n`);

  console.log('📋 Query SQL para insertar admin:\n');
  console.log(`INSERT INTO admins (email, password_hash, nombre, activo)`);
  console.log(`VALUES (`);
  console.log(`  'admin@ebiolink.com',`);
  console.log(`  '${hash}',`);
  console.log(`  'Administrador',`);
  console.log(`  true`);
  console.log(`);\n`);
}

// Obtener contraseña del argumento de línea de comandos
const password = process.argv[2];
generatePasswordHash(password);
