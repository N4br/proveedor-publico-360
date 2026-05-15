const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set("content-type", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `API error ${response.status}`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/pdf")) return (await response.blob()) as T;
  return (await response.json()) as T;
}
