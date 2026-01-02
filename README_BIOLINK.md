# 🔗 Sistema de Biolinks Dinámicos

Sistema completo para crear biolinks personalizados para médicos usando Next.js 15 y Neon PostgreSQL.

## 📋 Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Instalación](#instalación)
- [Migración de Base de Datos](#migración-de-base-de-datos)
- [Uso](#uso)
- [Estructura de Datos](#estructura-de-datos)
- [Ejemplos](#ejemplos)

---

## 🏗️ Arquitectura

### Componentes Principales

1. **BioLinkTemplate** (`app/components/BioLinkTemplate.tsx`)
   - Componente cliente reutilizable
   - Renderiza el biolink con datos dinámicos
   - Integra Cal.com para reservas

2. **Página Dinámica** (`app/(producto)/biolink/[slug]/page.tsx`)
   - Server Component que consulta la BD
   - Busca médico por slug
   - Renderiza metadata SEO dinámica

3. **Migración BD** (`lib/db/migrate-biolink.ts`)
   - Script para agregar columnas necesarias
   - Se ejecuta una sola vez

---

## 🚀 Instalación

### Paso 1: Ejecutar Migración de Base de Datos

Hay **3 formas** de ejecutar la migración:

#### Opción A: Desde la API (Recomendado)

```bash
curl -X POST https://tu-dominio.vercel.app/api/migrate-biolink \
  -H "Content-Type: application/json" \
  -d '{"adminKey": "TU_ADMIN_SECRET_KEY"}'
```

#### Opción B: Desde Node.js

```bash
npx tsx lib/db/migrate-biolink.ts
```

#### Opción C: SQL Directo en Neon

Ejecutá el archivo `lib/migrations/add-biolink-columns.sql` en tu consola de Neon.

---

## 🗄️ Migración de Base de Datos

### Columnas Agregadas a `clients`

| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| `slug` | varchar(100) UNIQUE | URL amigable única | `dr-juan-perez` |
| `nombre_completo` | varchar(255) | Nombre del profesional | `Dr. Juan Pérez` |
| `foto_url` | text | URL de foto de perfil | `/fotos/juan.jpg` |
| `especialidad` | varchar(255) | Especialidad médica | `Cardiólogo` |
| `matricula` | varchar(100) | Número de matrícula | `MN 12345` |
| `mensaje` | text | Mensaje personalizado | `Tu salud es mi prioridad` |
| `cal_username` | varchar(255) | Usuario de Cal.com | `dr-juan-perez` |
| `botones_config` | jsonb | Array de botones | Ver estructura abajo |
| `tema_config` | jsonb | Colores del tema | Ver estructura abajo |
| `biolink_activo` | boolean | Biolink visible | `true` / `false` |

### Índices Creados

- `idx_clients_slug` - Para búsquedas rápidas por slug
- `idx_clients_biolink_activo` - Para filtrar biolinks activos

---

## 📊 Estructura de Datos

### Formato de `botones_config` (JSONB)

```json
[
  {
    "label": "WhatsApp",
    "url": "https://wa.me/5492994091255"
  },
  {
    "label": "Instagram",
    "url": "https://instagram.com/dr.juan"
  },
  {
    "label": "Email",
    "url": "mailto:contacto@drjuan.com"
  }
]
```

### Formato de `tema_config` (JSONB)

```json
{
  "background": "#f8fafc",
  "text": "#0e0d0dff",
  "buttonBorder": "#ffffff",
  "separator": "#6ba1f2"
}
```

---

## 💻 Uso

### 1. Crear un Nuevo Biolink

```sql
INSERT INTO clients (
  id,
  user_id,
  client_name,
  mp_access_token,
  mp_user_id,
  slug,
  nombre_completo,
  foto_url,
  especialidad,
  matricula,
  mensaje,
  cal_username,
  botones_config,
  tema_config,
  biolink_activo
) VALUES (
  gen_random_uuid(),
  'user_123',
  'Dr. Juan Pérez',
  'MP_ACCESS_TOKEN_AQUI',
  '123456789',
  'dr-juan-perez',
  'Dr. Juan Pérez',
  '/fotos/juan.jpg',
  'Cardiólogo',
  'MN 12345',
  'Tu salud cardiovascular es mi prioridad',
  'dr-juan-perez',
  '[
    {"label": "WhatsApp", "url": "https://wa.me/5492994091255"},
    {"label": "Instagram", "url": "https://instagram.com/dr.juan"}
  ]'::jsonb,
  '{
    "background": "#e3f2fd",
    "text": "#1565c0",
    "buttonBorder": "#1976d2",
    "separator": "#42a5f5"
  }'::jsonb,
  true
);
```

### 2. Acceder al Biolink

Una vez creado, el biolink estará disponible en:

```
https://tu-dominio.com/biolink/dr-juan-perez
```

### 3. Actualizar Biolink

```sql
UPDATE clients
SET
  nombre_completo = 'Dr. Juan Carlos Pérez',
  especialidad = 'Cardiólogo Intervencionista',
  mensaje = 'Mensaje actualizado',
  botones_config = '[{"label": "Nuevo Botón", "url": "https://..."}]'::jsonb
WHERE slug = 'dr-juan-perez';
```

### 4. Desactivar Biolink

```sql
UPDATE clients
SET biolink_activo = false
WHERE slug = 'dr-juan-perez';
```

---

## 🎨 Personalización de Colores

### Temas Predefinidos

#### Azul Profesional (Default)
```json
{
  "background": "#f8fafc",
  "text": "#0e0d0dff",
  "buttonBorder": "#ffffff",
  "separator": "#6ba1f2"
}
```

#### Verde Salud
```json
{
  "background": "#f1f8f4",
  "text": "#1b5e20",
  "buttonBorder": "#4caf50",
  "separator": "#81c784"
}
```

#### Morado Moderno
```json
{
  "background": "#f3e5f5",
  "text": "#4a148c",
  "buttonBorder": "#7b1fa2",
  "separator": "#ba68c8"
}
```

---

## 📝 Ejemplos Completos

### Ejemplo 1: Cardiólogo con Múltiples Enlaces

```sql
INSERT INTO clients (
  id, user_id, slug, nombre_completo, foto_url,
  especialidad, matricula, mensaje, cal_username,
  botones_config, tema_config, biolink_activo
) VALUES (
  gen_random_uuid(),
  'user_cardio_1',
  'dr-martinez-cardio',
  'Dr. Roberto Martínez',
  'https://example.com/fotos/martinez.jpg',
  'Cardiólogo',
  'MN 54321',
  'Cuidamos tu corazón con tecnología de punta',
  'dr-roberto-martinez',
  '[
    {"label": "Agendar Consulta", "url": "tel:+5491123456789"},
    {"label": "WhatsApp", "url": "https://wa.me/5491123456789"},
    {"label": "Instagram", "url": "https://instagram.com/dr.martinez"},
    {"label": "LinkedIn", "url": "https://linkedin.com/in/drmartinez"}
  ]'::jsonb,
  '{
    "background": "#e3f2fd",
    "text": "#0d47a1",
    "buttonBorder": "#1976d2",
    "separator": "#42a5f5"
  }'::jsonb,
  true
);
```

### Ejemplo 2: Dermatóloga con Estilo Moderno

```sql
INSERT INTO clients (
  id, user_id, slug, nombre_completo, foto_url,
  especialidad, matricula, mensaje, cal_username,
  botones_config, tema_config, biolink_activo
) VALUES (
  gen_random_uuid(),
  'user_dermato_1',
  'dra-laura-skin',
  'Dra. Laura González',
  'https://example.com/fotos/laura.jpg',
  'Dermatóloga',
  'MN 98765',
  'Tu piel merece el mejor cuidado',
  'dra-laura-gonzalez',
  '[
    {"label": "Reservar Turno", "url": "https://wa.me/5492994091255"},
    {"label": "Instagram", "url": "https://instagram.com/dra.lauraskin"},
    {"label": "TikTok", "url": "https://tiktok.com/@dralauraskin"}
  ]'::jsonb,
  '{
    "background": "#fce4ec",
    "text": "#880e4f",
    "buttonBorder": "#c2185b",
    "separator": "#f06292"
  }'::jsonb,
  true
);
```

---

## 🔍 Consultas Útiles

### Ver todos los biolinks activos

```sql
SELECT slug, nombre_completo, especialidad, cal_username
FROM clients
WHERE biolink_activo = true
ORDER BY nombre_completo;
```

### Buscar por especialidad

```sql
SELECT slug, nombre_completo, especialidad
FROM clients
WHERE especialidad ILIKE '%cardio%'
  AND biolink_activo = true;
```

### Contar biolinks por estado

```sql
SELECT
  biolink_activo,
  COUNT(*) as total
FROM clients
GROUP BY biolink_activo;
```

---

## 🔒 Seguridad

### Datos NO Expuestos

El query de la página dinámica **NUNCA** devuelve:
- `mp_access_token` (Token de Mercado Pago)
- `mp_refresh_token` (Refresh token)
- `mp_user_id` (ID interno de MP)
- `id` (UUID interno del cliente)

### Solo se exponen datos públicos del biolink

---

## 🚨 Troubleshooting

### Error: "Perfil no encontrado"

**Causa:** El slug no existe o `biolink_activo = false`

**Solución:**
```sql
-- Verificar que existe
SELECT slug, biolink_activo FROM clients WHERE slug = 'tu-slug';

-- Activar si está inactivo
UPDATE clients SET biolink_activo = true WHERE slug = 'tu-slug';
```

### Error: "Column does not exist"

**Causa:** No se ejecutó la migración

**Solución:** Ejecutar migración según [Paso 1](#paso-1-ejecutar-migración-de-base-de-datos)

### Cal.com no se carga

**Causa:** `cal_username` está vacío o incorrecto

**Solución:**
```sql
UPDATE clients
SET cal_username = 'nombre-correcto-en-cal'
WHERE slug = 'tu-slug';
```

---

## 📞 Soporte

Para problemas o consultas:
- WhatsApp: https://wa.me/5492994091255
- Email: contacto@ebiolink.com

---

## 📄 Licencia

© 2025 E-Bio-Link - Todos los derechos reservados
