import { MercadoPublicoAttachmentExtractor } from "../services/attachmentExtractor.service.js";
import { MercadoPublicoService } from "../services/mercadoPublico.service.js";

const code = "1978-33-L126";
const mercadoPublico = new MercadoPublicoService();
const extractor = new MercadoPublicoAttachmentExtractor();

const tender = await mercadoPublico.getTenderByCode(code);
console.log("API Mercado Publico");
console.log(JSON.stringify(tender, null, 2));

const extraction = await extractor.extract(code);
console.log("Extractor adjuntos");
console.log(JSON.stringify(extraction, null, 2));

if (!tender) process.exitCode = 1;
