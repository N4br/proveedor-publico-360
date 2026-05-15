# Deploy gratis en Vercel

Este repo esta preparado para desplegar frontend y API en Vercel sin Render.

## Estructura usada por Vercel

- Frontend: `apps/web`.
- Build frontend: `npm run build:vercel`.
- Output frontend: `apps/web/dist`.
- API serverless: `api/index.ts`.
- Health check publico: `/api/health`.

La funcion serverless envuelve la API Fastify existente en `apps/api/src/server.ts`. Vercel reescribe `/api/:path*` hacia `/api?path=:path*`, la funcion reconstruye la URL interna y Fastify recibe rutas bajo `/api/*`.

## Pasos

1. Subir el repo a GitHub.
2. Entrar a Vercel y elegir `Add New Project`.
3. Importar `N4br/proveedor-publico-360`.
4. Mantener root directory en la raiz del repo.
5. Vercel detectara `vercel.json`.
6. Confirmar:
   - Install Command: `npm install`
   - Build Command: `npm run build:vercel`
   - Output Directory: `apps/web/dist`
7. Configurar variables de entorno.
8. Deploy.
9. Probar `https://tu-proyecto.vercel.app/api/health`.

## Variables de entorno en Vercel

Backend/serverless:

- `NODE_ENV=production`
- `CORS_ORIGIN=https://tu-proyecto.vercel.app`
- `PUBLIC_APP_URL=https://tu-proyecto.vercel.app`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_DOCUMENTS_BUCKET=company-documents`
- `SUPABASE_STORAGE_TENDER_BUCKET=tender-documents`
- `MERCADO_PUBLICO_TICKET`
- `MERCADO_PUBLICO_BASE_URL=https://api.mercadopublico.cl/servicios/v1/publico`
- `MERCADO_PUBLICO_ALLOW_HEADLESS_ATTACHMENTS=false`
- `ATTACHMENTS_DOWNLOAD_DIR=/tmp/attachments-test`
- `AI_MODE=mock`
- `OPENAI_API_KEY` opcional, solo si `AI_MODE=openai`
- `OPENAI_MODEL=gpt-4.1-mini`

Frontend:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL=/api`

## Seguridad

No configurar `SUPABASE_SERVICE_ROLE_KEY`, `MERCADO_PUBLICO_TICKET` ni `OPENAI_API_KEY` como variables `VITE_*`. Solo las variables con prefijo `VITE_` son expuestas al navegador.

## Limitaciones del plan gratis

- Serverless Functions tienen limites de duracion y tamano. El extractor Playwright/headless queda apagado por defecto.
- Archivos grandes deben manejarse con cuidado por limites de request serverless.
- Para analisis IA real, cambiar `AI_MODE=openai` y configurar `OPENAI_API_KEY`.
