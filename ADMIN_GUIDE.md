# Guía de Uso del Panel de Administración

## Acceso al Panel

1. **Login:** https://e-bio-link.vercel.app/admin/login
2. **Usuario:** `admin`
3. **Contraseña:** La que configuraste en la base de datos

## Gestión de Clientes

### Acceder a la Gestión de Clientes

Desde el panel principal, hacé clic en **"👥 Gestión de Clientes"** o andá directamente a:
https://e-bio-link.vercel.app/admin/clientes

### Crear un Nuevo Cliente

1. Hacé clic en **"➕ Nuevo Cliente"**
2. Completá los campos obligatorios:
   - **Slug (URL)**: Identificador único para el biolink (ej: `dr-juan-perez`)
     - Solo letras minúsculas, números y guiones
     - Se genera automáticamente cuando escribís
   - **Nombre Completo**: Nombre del médico (ej: "Dr. Juan Pérez")
   - **Especialidad**: Especialidad médica (ej: "Cardiología")
   - **Matrícula**: Matrícula profesional (ej: "MN 12345 / MP 67890")

3. Campos opcionales:
   - **Descripción/Bio**: Texto que aparece en el biolink
   - **URL de Foto de Perfil**: Link a la imagen del médico
   - **Cal.com API Key**: Para integrar agenda de turnos
   - **Cal.com Username**: Usuario de Cal.com

4. Hacé clic en **"➕ Crear Cliente"**

### Editar un Cliente

1. En la lista de clientes, hacé clic en **"✏️ Editar"**
2. Modificá los campos que necesites
3. Hacé clic en **"💾 Actualizar Cliente"**

**Nota:** El slug NO se puede editar después de creado.

### Eliminar un Cliente

1. Hacé clic en **"🗑️ Eliminar"**
2. Confirmá la acción

**⚠️ CUIDADO:** Esta acción no se puede deshacer.

## Conectar Mercado Pago

### ¿Por qué conectar Mercado Pago?

Para que un cliente pueda recibir pagos en su biolink, necesita conectar su cuenta de Mercado Pago.

### Proceso de Conexión

1. **Crear el cliente primero** en "Gestión de Clientes"
2. Ir a **"🔗 Generar Links OAuth"**
3. Completar:
   - **Nombre del Cliente**: El nombre del médico
   - **Clave de Administrador**: Tu `ADMIN_SECRET_KEY`
4. Copiar el link generado
5. Enviárselo al cliente por WhatsApp/Email
6. El cliente hace clic, autoriza en Mercado Pago
7. ¡Listo! Ahora tiene Mercado Pago conectado

### Verificar Conexión

En la lista de clientes, la columna "Mercado Pago" muestra:
- **✓ Conectado** (verde): Tiene Mercado Pago conectado
- **⚠ Sin conectar** (amarillo): Falta conectar Mercado Pago

## Flujo Completo Recomendado

### Para Agregar un Nuevo Médico:

1. **Paso 1:** Crear cliente en "Gestión de Clientes"
   - Completar todos los datos del médico
   - Slug, nombre, especialidad, matrícula, descripción, foto

2. **Paso 2:** Generar link OAuth
   - Ir a "Generar Links OAuth"
   - Crear link de autorización de Mercado Pago
   - Enviar link al médico

3. **Paso 3:** El médico autoriza
   - El médico hace clic en el link
   - Autoriza su cuenta de Mercado Pago
   - El sistema actualiza automáticamente los tokens

4. **Paso 4:** Verificar
   - Verificar que en la lista aparezca "✓ Conectado"
   - Visitar el biolink: `https://e-bio-link.vercel.app/biolink/slug-del-medico`
   - Confirmar que todo funciona

## Campos de la Base de Datos

### Campos que se crean manualmente:
- `slug` - URL del biolink (solo al crear)
- `nombre_completo` - Nombre del médico
- `especialidad` - Especialidad médica
- `matricula` - Matrícula profesional
- `descripcion` - Bio/descripción
- `foto_url` - URL de la foto
- `cal_api_key` - API key de Cal.com
- `cal_username` - Usuario de Cal.com

### Campos que se actualizan automáticamente (OAuth):
- `mp_access_token` - Token de Mercado Pago (encriptado)
- `mp_user_id` - ID de usuario de Mercado Pago
- `mp_refresh_token` - Token de refresco (encriptado)

### Campos automáticos:
- `created_at` - Fecha de creación
- `updated_at` - Última actualización
- `botones_config` - Configuración de botones (JSON)
- `tema_config` - Configuración de tema (JSON)

## Seguridad

### Tokens Encriptados

Los tokens de Mercado Pago se guardan **encriptados** en la base de datos usando AES-256-GCM.

Ver más en: [SECURITY.md](SECURITY.md)

### Acceso Administrativo

- Solo vos tenés acceso al panel de admin
- Necesitás la contraseña de admin para entrar
- La sesión expira automáticamente
- Podés cerrar sesión con el botón "Cerrar Sesión"

## URLs Importantes

- **Panel de Admin:** `/admin/login`
- **Gestión de Clientes:** `/admin/clientes`
- **Generar Links OAuth:** `/admin/generate-links`
- **Biolink de cliente:** `/biolink/{slug}`

## Validaciones Automáticas

### Slug:
- Solo letras minúsculas, números y guiones
- Sin espacios ni caracteres especiales
- Único (no puede haber dos iguales)
- Ejemplo válido: `dr-juan-perez`
- Ejemplo inválido: `Dr. Juan Pérez` (tiene mayúsculas y espacios)

### Nombre Completo:
- Máximo 255 caracteres
- Requerido

### Especialidad:
- Máximo 255 caracteres
- Requerido

### Matrícula:
- Máximo 100 caracteres
- Requerido

### Foto URL:
- Debe ser una URL válida
- Opcional

### Cal.com Username:
- Máximo 255 caracteres
- Opcional

## Problemas Comunes

### "Este slug ya existe"
El slug debe ser único. Probá con:
- `dr-juan-perez`
- `dr-juan-perez-2`
- `dr-juan-perez-cardiologo`

### "No autorizado" al acceder al panel
- Verificá que iniciaste sesión
- Intentá cerrar sesión y volver a entrar
- Verificá que la contraseña sea correcta

### El cliente no aparece como "Conectado"
- Verificá que el cliente haya completado el proceso OAuth
- El cliente debe hacer clic en el link y autorizar
- Una vez autorizado, el estado se actualiza automáticamente

### El biolink no se ve
- Verificá que el slug sea correcto
- La URL es: `https://e-bio-link.vercel.app/biolink/{slug}`
- El slug es sensible a mayúsculas (siempre usar minúsculas)

## Tips y Mejores Prácticas

1. **Slugs descriptivos:** Usá slugs fáciles de recordar
   - ✅ `dr-juan-perez`
   - ✅ `dra-maria-gonzalez`
   - ❌ `medico1`
   - ❌ `abc123`

2. **Completá toda la info:** Aunque algunos campos son opcionales, completar todo mejora el biolink
   - Agregá descripción profesional
   - Subí foto de perfil
   - Incluí matrícula completa

3. **Mercado Pago primero:** Antes de promocionar el biolink, verificá que Mercado Pago esté conectado

4. **Test antes de entregar:** Visitá el biolink y probá que todo funcione antes de enviárselo al médico

5. **Backup de slugs:** Guardá una lista de los slugs que creaste para referencia rápida
