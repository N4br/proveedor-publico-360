import { z } from "zod";

const boolFromEnv = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((value) => value === true || (typeof value === "string" && ["1", "true", "yes"].includes(value.toLowerCase())));

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  PUBLIC_APP_URL: z.string().url().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_DOCUMENTS_BUCKET: z.string().default("company-documents"),
  SUPABASE_STORAGE_TENDER_BUCKET: z.string().default("tender-documents"),
  MERCADO_PUBLICO_TICKET: z.string().default("F8537A18-6766-4DEF-9E59-426B4FEE2844"),
  MERCADO_PUBLICO_BASE_URL: z.string().url().default("https://api.mercadopublico.cl/servicios/v1/publico"),
  MERCADO_PUBLICO_ALLOW_HEADLESS_ATTACHMENTS: boolFromEnv.default(false),
  ATTACHMENTS_DOWNLOAD_DIR: z.string().default("attachments-test"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  AI_MODE: z.enum(["mock", "openai"]).default("mock")
});

export const env = schema.parse(process.env);

export function assertSupabaseConfigured() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase server configuration is missing");
  }
}
