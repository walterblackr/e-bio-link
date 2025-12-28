// scripts/emergency-revoke-all.ts
// Script de emergencia para revocar TODOS los tokens en caso de filtración masiva
// SOLO EJECUTAR EN EMERGENCIA

import { neon } from '@neondatabase/serverless';
import axios from 'axios';

async function emergencyRevokeAll() {
  console.log('🚨 INICIANDO REVOCACIÓN DE EMERGENCIA DE TODOS LOS TOKENS');
  console.log('⚠️  Esta acción no se puede deshacer');

  const sql = neon(process.env.DATABASE_URL!);

  try {
    // 1. Obtener todos los clientes
    const clients = await sql`
      SELECT slug, mp_access_token FROM clients
    `;

    console.log(`📊 Encontrados ${clients.length} clientes`);

    let revokedCount = 0;
    let errorCount = 0;

    // 2. Revocar cada token
    for (const client of clients) {
      try {
        console.log(`Revocando acceso para: ${client.slug}`);

        // Revocar en Mercado Pago
        await axios.delete(
          `https://api.mercadopago.com/oauth/token/${client.mp_access_token}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
            },
            params: {
              client_id: process.env.MP_CLIENT_ID,
              client_secret: process.env.MP_CLIENT_SECRET,
            },
          }
        );

        revokedCount++;
        console.log(`✅ Revocado: ${client.slug}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error revocando ${client.slug}:`, error);
      }
    }

    // 3. Limpiar TODA la tabla
    await sql`TRUNCATE TABLE clients`;

    console.log('\n📋 RESUMEN:');
    console.log(`✅ Tokens revocados: ${revokedCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`🗑️  Base de datos limpiada completamente`);
    console.log('\n⚠️  TODOS los médicos tendrán que reconectar sus cuentas');

  } catch (error) {
    console.error('💥 Error crítico en revocación de emergencia:', error);
    process.exit(1);
  }
}

// Ejecutar
emergencyRevokeAll()
  .then(() => {
    console.log('\n✅ Revocación de emergencia completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
