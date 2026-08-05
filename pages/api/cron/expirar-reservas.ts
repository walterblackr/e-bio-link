// pages/api/cron/expirar-reservas.ts
// Disparado por cron-job.org cada 15 minutos (POST con Authorization: Bearer CRON_SECRET).
// Cancela reservas pending_payment vencidas y avisa al paciente si el turno es futuro.
import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { sendReservaExpirada } from '../../../lib/email';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Acepta GET o POST con el secret como query param o header Authorization
  const secret = req.query.secret ?? req.headers['authorization']?.replace('Bearer ', '');
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  // Cancela todas las vencidas en una sola query y retorna los datos para el correo.
  // UPDATE ... RETURNING garantiza idempotencia: en el próximo barrido ya están cancelled.
  const expiradas = await sql`
    UPDATE bookings b
    SET estado = 'cancelled', updated_at = now()
    FROM clients c
    WHERE b.client_id = c.id
      AND b.estado = 'pending_payment'
      AND b.expires_at IS NOT NULL
      AND b.expires_at <= now()
    RETURNING
      b.id,
      b.paciente_nombre,
      b.paciente_email,
      b.fecha_hora,
      c.slug,
      c.nombre_completo,
      c.email AS medico_email
  `;

  const ahora = new Date();
  let enviados = 0;

  for (const r of expiradas) {
    // Mail solo si el turno es futuro: cancelar uno pasado es limpieza silenciosa
    if (new Date(r.fecha_hora) <= ahora) continue;

    try {
      await sendReservaExpirada({
        paciente_nombre: r.paciente_nombre,
        paciente_email: r.paciente_email,
        fecha_hora: r.fecha_hora,
        medico_nombre: r.nombre_completo,
        medico_email: r.medico_email || undefined,
        slug: r.slug,
      });
      enviados++;
    } catch (err) {
      console.error(`[cron] Falló el aviso de expiración de la reserva ${r.id}:`, err);
    }
  }

  console.log(`[cron] expirar-reservas: canceladas=${expiradas.length} correos=${enviados}`);
  return res.status(200).json({ canceladas: expiradas.length, correos: enviados });
}
