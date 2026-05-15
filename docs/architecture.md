# Arquitectura tecnica

## Vision modular

Proveedor Publico 360 se estructura como monorepo:

- `apps/web`: portal React para clientes, revisores LEXUM y administradores.
- `apps/api`: API segura, integraciones externas, PDF, IA y extraccion de adjuntos.
- `packages/shared`: tipos, reglas de planes, tipos documentales y algoritmo de score.
- `supabase/migrations`: schema SQL, RLS, storage policies y tablas base.

La regla central es que el frontend nunca llama directamente a Mercado Publico, OpenAI ni al service role de Supabase. Todo dato sensible pasa por `apps/api`.

## Flujo MVP

1. Usuario se registra con Supabase Auth.
2. API crea/actualiza perfil y empresa.
3. Cliente completa perfil empresa.
4. Score calcula brechas con datos de empresa y Carpeta Viva.
5. Cliente sube documentos privados a Supabase Storage.
6. Usuario busca licitacion por ID.
7. API consulta Mercado Publico usando `MERCADO_PUBLICO_TICKET`.
8. Sala de Oferta intenta descubrir adjuntos publicos.
9. Si el portal bloquea la descarga automatica, solicita carga manual.
10. AI Service genera analisis mock o real segun `AI_MODE`.
11. PDF Service genera diagnostico o reporte de Sala de Oferta.

## Componentes backend

- `MercadoPublicoService`: licitaciones por codigo, fecha, estado, comprador/proveedor y ordenes de compra.
- `MercadoPublicoAttachmentExtractor`: extractor reemplazable para adjuntos.
- `AIService`: prompts estrictos, salida JSON, mock por defecto y OpenAI opcional.
- `PDFService`: reportes con portada, resumen, tablas, semaforos y disclaimer.
- `StorageService`: validacion y subida privada de documentos.
- `Auth helpers`: validacion de JWT Supabase y roles.

## Modelo de roles

- `admin`: administracion LEXUM y acceso global.
- `revisor_lexum`: puede revisar empresas/documentos/salas asignadas.
- `cliente`: acceso limitado a sus empresas y documentos.

La autorizacion fina vive en Supabase RLS. El backend puede usar service role para operaciones internas, pero debe validar contexto antes de escribir datos de cliente.

## Deploy

### Vercel + Supabase

- `apps/web` en Vercel con `VITE_API_URL=/api`.
- `api/index.ts` en Vercel como Serverless Function unica que envuelve `apps/api/src/server.ts`.
- Supabase para Auth/Postgres/Storage.
- Vercel Cron, Supabase Edge Functions o GitHub Actions para radar mensual.

### Consideracion Playwright

La extraccion headless de adjuntos con Playwright no es ideal en Vercel gratis por tamano, duracion y runtime serverless. En el despliegue gratuito queda deshabilitada por defecto con `MERCADO_PUBLICO_ALLOW_HEADLESS_ATTACHMENTS=false`; el extractor HTML detecta captcha/sesion y activa carga manual.

## Variables de entorno criticas

- `MERCADO_PUBLICO_TICKET`: ticket tecnico ChileCompra. Backend only.
- `OPENAI_API_KEY`: backend only.
- `SUPABASE_SERVICE_ROLE_KEY`: backend only.
- `VITE_SUPABASE_ANON_KEY`: puede ir al browser.
- `VITE_API_URL`: usar `/api` para Vercel same-origin.

## Limites del MVP

- No reemplaza revision juridica humana.
- El extractor de adjuntos depende del portal publico y puede quedar bloqueado por reCAPTCHA, sesion o cambios HTML.
- El analisis IA real requiere `OPENAI_API_KEY`; sin ella retorna mock estructurado.
- Los jobs recurrentes quedan preparados, no activados por defecto.
- Pagos Flow/Transbank y WhatsApp quedan fuera de prioridad MVP inicial.
