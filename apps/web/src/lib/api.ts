const DEFAULT_API_URL = "/api";

function normalizeApiBaseUrl(value: unknown) {
  if (typeof value !== "string") return DEFAULT_API_URL;

  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") return DEFAULT_API_URL;

  const withoutTrailingSlash = trimmed.replace(/\/+$/, "");
  if (!withoutTrailingSlash) return DEFAULT_API_URL;

  if (withoutTrailingSlash.startsWith("/")) {
    return withoutTrailingSlash === "/api" ? DEFAULT_API_URL : DEFAULT_API_URL;
  }

  try {
    const url = new URL(withoutTrailingSlash);
    return url.toString().replace(/\/+$/, "");
  } catch {
    return DEFAULT_API_URL;
  }
}

function normalizeApiPath(path: string) {
  const trimmed = path.trim();
  if (!trimmed) return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function buildApiUrl(path: string) {
  const baseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
  const normalizedPath = normalizeApiPath(path);

  if (baseUrl.startsWith("http")) {
    return `${baseUrl}${normalizedPath}`;
  }

  return `${baseUrl}${normalizedPath}`.replace(/\/{2,}/g, "/");
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set("content-type", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);

  const finalUrl = buildApiUrl(path);
  if (import.meta.env.DEV) {
    console.info("[Proveedor Publico 360] API request", finalUrl);
  }

  const response = await fetch(finalUrl, { ...options, headers });
  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok) {
    const text = await response.text();
    if (text.includes("NOT_FOUND")) {
      throw new Error("Ruta API no encontrada. Revisar VITE_API_URL o vercel.json.");
    }
    throw new Error(`API error ${response.status} at ${finalUrl}: ${text || response.statusText}`);
  }

  if (contentType?.includes("application/pdf")) return (await response.blob()) as T;

  const text = await response.text();
  if (!contentType.includes("application/json")) {
    if (text.includes("NOT_FOUND")) {
      throw new Error("Ruta API no encontrada. Revisar VITE_API_URL o vercel.json.");
    }
    throw new Error(`Respuesta API no JSON. Status ${response.status} at ${finalUrl}: ${text.slice(0, 500)}`);
  }

  return JSON.parse(text) as T;
}
