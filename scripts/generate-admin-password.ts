// Script para generar hash de contraseña de admin
// Uso: npx tsx scripts/generate-admin-password.ts <contraseña>

import bcrypt from 'bcryptjs';

async function generatePasswordHash(password: string) {
  if (!password) {
    console.error('❌ Error: Debes proporcionar una contraseña');
    process.exit(1);
  }



  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);


}

// Obtener contraseña del argumento de línea de comandos
const password = process.argv[2];
generatePasswordHash(password);
