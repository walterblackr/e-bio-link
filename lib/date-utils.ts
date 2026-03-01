// date-utils.ts
// La columna fecha_hora en bookings es TIMESTAMPTZ — PostgreSQL guarda UTC,
// Neon devuelve ISO string con offset correcto.
// No se necesita ninguna conversión manual de zona horaria.
// Para display usar: new Date(fecha_hora).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
