# ClaudeWriter — estudio de escritura

Aplicación React + Vite servida por Express. Incluye editor de manuscritos, asistente literario, exportación, respaldo local y soporte PWA instalable.

## Ejecutar localmente

1. Instalar Node.js 20 o superior.
2. Ejecutar `npm install`.
3. Copiar `.env.example` a `.env` y configurar `OPENAI_API_KEY` (recomendado) o `GEMINI_API_KEY`.
4. Ejecutar `npm run dev`.
5. Abrir la URL local que muestre la terminal.

## Integración con ChatGPT / OpenAI

La app llama a la API de OpenAI desde el servidor Express mediante `OPENAI_API_KEY`; la clave no se envía al navegador. Por defecto usa `gpt-4.1-mini`, modificable con `OPENAI_MODEL`. La API se factura por separado de ChatGPT Plus/Free: una suscripción de ChatGPT no incluye automáticamente créditos de API. No guardes claves dentro del código ni en variables `VITE_*`.

Cuando `OPENAI_API_KEY` está configurada, Hermes prioriza OpenAI para chat y acciones editoriales. Si no está configurada, continúa el comportamiento existente con Gemini y, cuando corresponda, Anthropic.

## Guardado y recuperación

Los libros se guardan localmente en el navegador. Cada guardado conserva hasta dos instantáneas previas y una última copia válida de recuperación. Esto ayuda ante errores del almacenamiento local, pero **no reemplaza una copia externa**: exportá regularmente el Backup JSON o usá la opción de Google Drive. Si borrás los datos del navegador o cambiás de dispositivo, necesitás importar una copia de seguridad.

## Instalar en PC o teléfono

Una vez publicada en HTTPS, abrí la URL en Chrome o Edge y usá el icono **Instalar aplicación** de la barra de direcciones/menú. En iPhone/iPad, abrí en Safari y elegí Compartir → Añadir a pantalla de inicio. La app incluye manifest, icono y service worker básico; el editor necesita conexión para las funciones de IA y no almacena respuestas de la API sin conexión.

## Publicar (recomendado: Render)

El proyecto necesita un servidor Node/Express para la IA, así que para la primera publicación recomendamos **Render Web Service** (más directo que separar frontend y funciones serverless).

- Subí el contenido descomprimido a un repositorio privado de GitHub.
- En Render, creá un **New → Web Service** y conectá el repositorio.
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Agregá `OPENAI_API_KEY` y `OPENAI_MODEL` como variables de entorno privadas en Render.
- Publicá y probá `/api/status`; luego abrí la URL HTTPS para instalar la app.

El servicio actual no incluye una base de datos multiusuario en la nube: los manuscritos se guardan por navegador. Para sincronizar varios dispositivos o cuentas, la siguiente etapa debería incorporar autenticación y una base de datos (por ejemplo, Supabase/Firebase) con reglas de acceso y versiones. El nivel gratuito de algunos hosts puede suspenderse por inactividad.

## Comprobaciones

- `npm run build`: compila el frontend.
- `npm run lint`: comprobación TypeScript (puede reportar errores preexistentes del proyecto).
