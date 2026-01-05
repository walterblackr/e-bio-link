// scripts/emergency-revoke-all.ts
// Script de emergencia para revocar TODOS los tokens en caso de filtración masiva
// SOLO EJECUTAR EN EMERGENCIA

import { neon } from '@neondatabase/serverless';
import axios from 'axios';

async function emergencyRevokeAll() {


  const sql = neon(process.env.DATABASE_URL!);

  try {
    // 1. Obtener todos los clientes
    const clients = await sql`
      SELECT id, client_name, mp_access_token FROM clients
    `;

  

    let revokedCount = 0;
    let errorCount = 0;

    // 2. Revocar cada token
    for (const client of clients) {
      try {
      
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

      } catch (error) {
        errorCount++;
        console.error(`❌ Error revocando ${client.client_name || client.id}:`, error);
      }
    }

    // 3. Limpiar TODA la tabla
    await sql`TRUNCATE TABLE clients`;

  } catch (error) {
    console.error('💥 Error crítico en revocación de emergencia:', error);
    process.exit(1);
  }
}

// Ejecutar
emergencyRevokeAll()
  .then(() => {

    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
