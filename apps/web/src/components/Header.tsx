import { useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { LogIn, LogOut, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";

type Props = {
  session: Session | null;
};

export function Header({ session }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function signIn() {
    if (!supabase) {
      setStatus("Modo local activo.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setStatus(error.message);
  }

  async function signUp() {
    if (!supabase) {
      setStatus("Configura Supabase para registro real.");
      return;
    }
    const { error } = await supabase.auth.signUp({ email, password });
    setStatus(error ? error.message : "Registro creado. Revisa confirmacion de correo si esta activa.");
  }

  async function signOut() {
    await supabase?.auth.signOut();
  }

  return (
    <header className="border-b border-lexum-line bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-lexum-navy text-lexum-gold">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lexum-gold">LEXUM</p>
            <h1 className="text-xl font-semibold text-lexum-navy">Proveedor Publico 360</h1>
          </div>
        </div>

        {session ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{session.user.email}</span>
            <button onClick={signOut} className="focus-ring inline-flex items-center gap-2 rounded-md border border-lexum-line px-3 py-2 text-sm font-medium text-lexum-ink hover:bg-lexum-mist">
              <LogOut size={16} />
              Salir
            </button>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
            <input className="focus-ring rounded-md border border-lexum-line px-3 py-2 text-sm" placeholder="correo" value={email} onChange={(event) => setEmail(event.target.value)} />
            <input className="focus-ring rounded-md border border-lexum-line px-3 py-2 text-sm" placeholder="clave" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            <button onClick={signIn} className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-lexum-navy px-3 py-2 text-sm font-medium text-white hover:bg-lexum-ink">
              <LogIn size={16} />
              Ingresar
            </button>
            <button onClick={signUp} className="focus-ring rounded-md border border-lexum-gold px-3 py-2 text-sm font-medium text-lexum-navy hover:bg-amber-50">
              Registro
            </button>
          </div>
        )}
      </div>
      {status ? <div className="mx-auto max-w-7xl px-4 pb-3 text-xs text-slate-600 lg:px-8">{status}</div> : null}
    </header>
  );
}
