# Investigacion tecnica: adjuntos Mercado Publico

Fecha de verificacion: 15-05-2026. Caso: `1978-33-L126`.

## Resultado API oficial

Endpoint probado:

`https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?codigo=1978-33-L126&ticket=...`

Resultado observado:

- `Cantidad: 1`
- `CodigoExterno: 1978-33-L126`
- `Estado: Publicada`
- Comprador: `SERVICIO DE SALUD DEL MAULE`
- Monto estimado: `7000000`
- Item: servicios de catering.

## Resultado ficha publica

URL probada:

`https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idlicitacion=1978-33-L126`

La ficha carga HTML publico y contiene un control `imgAdjuntos` con apertura a:

`../Attachment/ViewAttachment.aspx?enc=...`

## Puerta de adjuntos

La pagina `ViewAttachment.aspx?enc=...` no entrega una tabla de documentos inmediatamente. Incluye:

- `https://www.google.com/recaptcha/enterprise.js`
- `grecaptcha.enterprise.execute(...)`
- POST a `ViewAttachment.aspx?ajax=1`
- Redireccion a `ViewAttachmentLC.aspx?enc=...` si el score del token supera el umbral.
- Redireccion a `/Procurement/403.html` si falla.

La llamada directa a `ViewAttachmentLC.aspx?enc=...` sin validacion devuelve contenido de acceso denegado/robot.

## Implicacion para el MVP

La descarga automatica de adjuntos no puede prometerse como garantizada. El MVP implementa el flujo profesional:

1. Descubrir URL de ficha publica.
2. Descubrir gateway de adjuntos.
3. Intentar extractor headless normal, sin resolver captcha por terceros ni eludir controles.
4. Si aparece reCAPTCHA/403/sesion, devolver `captcha_o_sesion_requerida`.
5. Activar carga manual de bases/anexos en Sala de Oferta.
6. Analizar documentos cargados por cliente.

## Estados del extractor

- `ok`: archivos descargados o listados.
- `adjuntos_no_disponibles_automaticamente`: no se encontro boton/enlace de adjuntos.
- `requiere_carga_manual`: no hay ruta automatica confiable para el caso.
- `error_portal`: error 5xx/HTML inesperado/cambio fuerte del portal.
- `captcha_o_sesion_requerida`: reCAPTCHA, 403, robot o login requerido.

## Workaround recomendado

Mantener descarga automatica como funcionalidad experimental y ofrecer siempre fallback manual. En operaciones LEXUM, el revisor puede descargar bases desde navegador autenticado o desde la ficha publica cuando el portal lo permite, y subirlas a Sala de Oferta para analisis.
