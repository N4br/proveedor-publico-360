import type { FastifyRequest } from "fastify";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase.js";

export type UserContext = {
  id: string;
  email?: string;
  role: "admin" | "cliente" | "revisor_lexum";
};

export async function getUserContext(request: FastifyRequest): Promise<UserContext> {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : undefined;

  if (!token) {
    if (process.env.NODE_ENV !== "production") {
      return { id: "00000000-0000-0000-0000-000000000000", email: "dev@lexum.local", role: "admin" };
    }
    const error = new Error("No autorizado");
    Object.assign(error, { statusCode: 401 });
    throw error;
  }

  if (!isSupabaseConfigured()) {
    return { id: "00000000-0000-0000-0000-000000000000", email: "dev@lexum.local", role: "admin" };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    const authError = new Error("Token invalido");
    Object.assign(authError, { statusCode: 401 });
    throw authError;
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();

  return {
    id: data.user.id,
    email: data.user.email,
    role: (profile?.role as UserContext["role"]) ?? "cliente"
  };
}
