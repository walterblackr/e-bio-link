-- Ejemplo completo de biolink con todos los campos
-- Primero ejecutá: lib/migrations/add-professional-fields.sql

-- Ejemplo 1: Cardiólogo completo
INSERT INTO clients (
  slug,
  mp_access_token,
  mp_user_id,
  mp_refresh_token,
  nombre_completo,
  especialidad,
  matricula,
  descripcion,
  foto_url,
  cal_username,
  botones_config,
  tema_config,
  created_at,
  updated_at
) VALUES (
  'dr-martinez-cardio',
  'TEST_MP_TOKEN_CARDIO',
  '111222333',
  'TEST_MP_REFRESH_CARDIO',
  'Dr. Roberto Martínez',
  'Cardiólogo',
  'MN 12345 - MP 54321',
  'Especialista en cardiología clínica e intervencionista. Tu salud cardiovascular es mi prioridad.',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Roberto',
  'dr-roberto-martinez',
  '[
    {
      "label": "WhatsApp Urgencias",
      "url": "https://wa.me/5492994091255?text=Hola%20Dr.%20Mart%C3%ADnez,%20necesito%20agendar%20una%20consulta"
    },
    {
      "label": "Instagram",
      "url": "https://www.instagram.com/dr.martinez.cardio"
    },
    {
      "label": "LinkedIn",
      "url": "https://www.linkedin.com/in/drmartinez"
    },
    {
      "label": "Estudios Online",
      "url": "https://drive.google.com/drmartinez"
    }
  ]'::jsonb,
  '{
    "background": "#e3f2fd",
    "text": "#0d47a1",
    "buttonBorder": "#1976d2",
    "separator": "#42a5f5"
  }'::jsonb,
  NOW(),
  NOW()
);

-- Ejemplo 2: Nutricionista completa
INSERT INTO clients (
  slug,
  mp_access_token,
  mp_user_id,
  mp_refresh_token,
  nombre_completo,
  especialidad,
  matricula,
  descripcion,
  foto_url,
  cal_username,
  botones_config,
  tema_config,
  created_at,
  updated_at
) VALUES (
  'lic-sofia-nutricion',
  'TEST_MP_TOKEN_NUTRI',
  '444555666',
  'TEST_MP_REFRESH_NUTRI',
  'Lic. Sofía González',
  'Licenciada en Nutrición',
  'MP 9876',
  'Nutrición deportiva y planes alimentarios personalizados. ¡Alcanzá tus objetivos de forma saludable!',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia&backgroundColor=c0aede',
  'lic-sofia-gonzalez',
  '[
    {
      "label": "WhatsApp Consultas",
      "url": "https://wa.me/5492994091255?text=Hola%20Lic.%20Sof%C3%ADa,%20quiero%20un%20plan%20nutricional"
    },
    {
      "label": "Instagram Recetas",
      "url": "https://www.instagram.com/lic.sofianutricion"
    },
    {
      "label": "TikTok Tips",
      "url": "https://www.tiktok.com/@sofianutri"
    },
    {
      "label": "YouTube",
      "url": "https://www.youtube.com/@sofianutricion"
    },
    {
      "label": "Plan Online",
      "url": "https://calendly.com/sofianutri"
    }
  ]'::jsonb,
  '{
    "background": "#f1f8f4",
    "text": "#1b5e20",
    "buttonBorder": "#4caf50",
    "separator": "#81c784"
  }'::jsonb,
  NOW(),
  NOW()
);

-- Ejemplo 3: Psicóloga
INSERT INTO clients (
  slug,
  mp_access_token,
  mp_user_id,
  mp_refresh_token,
  nombre_completo,
  especialidad,
  matricula,
  descripcion,
  foto_url,
  cal_username,
  botones_config,
  tema_config,
  created_at,
  updated_at
) VALUES (
  'lic-maria-psicologia',
  'TEST_MP_TOKEN_PSI',
  '777888999',
  'TEST_MP_REFRESH_PSI',
  'Lic. María Fernández',
  'Psicóloga Clínica',
  'MP 11223',
  'Terapia individual y de pareja. Especializada en ansiedad y gestión emocional.',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria&backgroundColor=ffd5dc',
  'lic-maria-fernandez',
  '[
    {
      "label": "WhatsApp Turnos",
      "url": "https://wa.me/5492994091255?text=Hola%20Lic.%20Mar%C3%ADa,%20necesito%20una%20consulta"
    },
    {
      "label": "Instagram",
      "url": "https://www.instagram.com/lic.mariapsi"
    },
    {
      "label": "Email",
      "url": "mailto:maria.psi@example.com"
    }
  ]'::jsonb,
  '{
    "background": "#fce4ec",
    "text": "#880e4f",
    "buttonBorder": "#c2185b",
    "separator": "#f06292"
  }'::jsonb,
  NOW(),
  NOW()
);

-- URLs para acceder:
-- https://e-bio-link.vercel.app/biolink/dr-martinez-cardio
-- https://e-bio-link.vercel.app/biolink/lic-sofia-nutricion
-- https://e-bio-link.vercel.app/biolink/lic-maria-psicologia
