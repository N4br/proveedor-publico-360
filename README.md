# Proveedor Publico 360

MVP full-stack para LEXUM orientado a empresas proveedoras que quieren vender al Estado chileno mediante Mercado Publico. La plataforma cubre diagnostico, perfil empresa, Score Proveedor Publico, Carpeta Viva, consulta de licitaciones, Sala de Oferta, extractor experimental de adjuntos y reportes PDF.

## Stack

- Frontend: React + TypeScript + Vite + Tailwind.
- Backend: Node.js + TypeScript + Fastify.
- DB/Auth/Storage: Supabase/PostgreSQL, Supabase Auth y Storage privado.
- IA: capa backend preparada para OpenAI u otro LLM, con mock seguro por defecto.
- PDF: PDFKit en backend.
- Jobs: preparado para Vercel Cron o Supabase Edge Functions.
- Adjuntos Mercado Publico: extractor modular experimental con fallback manual.

## Instalacion local

```bash
npm install
cp .env.example .env
npm run dev
```

Frontend: `http://localhost:5173`  
API local: `http://localhost:4000/health`  
API via frontend/Vercel: `/api/health`

Para usar Supabase:

1. Crear proyecto Supabase.
2. Ejecutar `supabase/migrations/0001_initial_schema.sql`.
3. Crear buckets privados `company-documents` y `tender-documents` si no fueron creados por la migracion.
4. Configurar `.env` con `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.

## Prueba tecnica del caso 1978-33-L126

```bash
npm run test:mp
```

La prueba consulta la API oficial y luego intenta descubrir adjuntos desde la ficha publica. En la verificacion realizada el 15-05-2026:

- La API oficial respondio correctamente para `1978-33-L126`.
- La ficha publica cargo por `DetailsAcquisition.aspx?idlicitacion=1978-33-L126`.
- El HTML publico expuso una pagina intermedia `Attachment/ViewAttachment.aspx?enc=...`.
- Esa pagina ejecuta reCAPTCHA Enterprise y redirige a `ViewAttachmentLC.aspx` solo si la validacion pasa.
- La llamada directa a `ViewAttachmentLC.aspx` sin token devuelve pagina de acceso denegado/robot.

Por eso el MVP declara tecnicamente: obtener datos publicos, intentar recuperar adjuntos disponibles y analizar documentos cargados por el cliente. Si el portal bloquea la descarga automatica, Sala de Oferta solicita carga manual.

## Seguridad

- `MERCADO_PUBLICO_TICKET`, `OPENAI_API_KEY` y `SUPABASE_SERVICE_ROLE_KEY` solo viven en backend.
- Supabase RLS separa roles `admin`, `cliente` y `revisor_lexum`.
- Documentos se suben a buckets privados.
- El backend valida tipo y tamano de archivo.
- Logs evitan imprimir tickets, API keys o tokens.
- El motor IA separa hechos de recomendaciones y marca conclusiones juridicas como preliminares.

## Deploy gratis en Vercel

- Frontend: Vercel construye `apps/web` con `npm run build:vercel` y publica `apps/web/dist`.
- API: Vercel expone `api/[...path].ts` como Serverless Function, envolviendo la API Fastify existente.
- Endpoints: en produccion quedan bajo `/api/*`; por ejemplo `/api/health`.
- Supabase: proyecto administrado con migraciones y buckets privados.
- DNS:
  - landing comercial: `lexumabogados.cl/proveedor-publico-360`
  - portal/app: `proveedor.lexum.cl` o `portal.lexum.cl`

Ver pasos exactos en [docs/vercel-deploy.md](docs/vercel-deploy.md), arquitectura en [docs/architecture.md](docs/architecture.md) y adjuntos en [docs/mercado-publico-adjuntos.md](docs/mercado-publico-adjuntos.md).
