// Utilidades de fecha/hora para Argentina (UTC-3, sin horario de verano)
// PROBLEMA: fecha_hora se guarda como TIMESTAMP WITHOUT TIME ZONE en PostgreSQL.
// PostgreSQL guarda el valor literal (sin convertir). Neon lo devuelve con sufijo Z
// haciendo que JavaScript lo interprete como UTC en lugar de hora Argentina.
// SOLUCIÓN: reemplazar el Z por -03:00 antes de crear el objeto Date.

const AR_OFFSET = '-03:00';

/**
 * Parsea un timestamp de la BD como hora Argentina.
 * Neon devuelve TIMESTAMP sin zona con sufijo Z (no es UTC, es hora local AR).
 */
export function parseArgentinaDate(fechaHora: string | Date): Date {
  const str = String(fechaHora);
  if (str.endsWith('Z')) {
    return new Date(str.slice(0, -1) + AR_OFFSET);
  }
  return new Date(str);
}
