import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Header, Footer } from "@/components/Header";
import {
  adminListArtworks,
  adminSaveArtwork,
  adminDeleteArtwork,
  adminIsAdmin,
  adminClaimIfEmpty,
} from "@/lib/admin.functions";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Ateliê · Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type Artwork = {
  id: string;
  title: string;
  technique: string;
  year: number;
  width_cm: number;
  height_cm: number;
  description: string;
  price_brl: number;
  preview_url: string;
  original_path: string;
  published: boolean;
};

const emptyForm = {
  id: undefined as string | undefined,
  title: "",
  technique: "",
  year: new Date().getFullYear(),
  width_cm: 30,
  height_cm: 40,
  description: "",
  price_brl: 500,
  preview_url: "",
  original_path: "",
  published: true,
};

function AdminPage() {
  const [session, setSession] = useState<null | { email: string }>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session?.user ? { email: data.session.user.email ?? "" } : null);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s?.user ? { email: s.user.email ?? "" } : null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-10">
        {checking ? (
          <p className="text-technical">Carregando…</p>
        ) : session ? (
          <AdminPanel email={session.email} />
        ) : (
          <SignIn />
        )}
      </main>
      <Footer />
    </div>
  );
}

function SignIn() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast.success("Conta criada. Se seu projeto exigir confirmação, verifique o e-mail.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <p className="text-technical">Acesso restrito</p>
      <h1 className="mt-3 font-serif text-3xl">Ateliê da Ana · admin</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4 border border-border p-6">
        <label className="block">
          <span className="text-technical">E-mail</span>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full border border-border bg-background px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-technical">Senha</span>
          <input
            type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full border border-border bg-background px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
          />
        </label>
        <button disabled={loading} className="w-full bg-primary py-2.5 text-primary-foreground hover:opacity-90 disabled:opacity-60">
          {loading ? "…" : mode === "signin" ? "Entrar" : "Criar conta"}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full text-technical hover:text-primary"
        >
          {mode === "signin" ? "Primeira vez? criar conta" : "Já tem conta? entrar"}
        </button>
      </form>
      <p className="mt-4 text-technical text-center">
        A primeira conta criada pode se promover a administradora do ateliê.
      </p>
    </div>
  );
}

function AdminPanel({ email }: { email: string }) {
  const list = useServerFn(adminListArtworks);
  const save = useServerFn(adminSaveArtwork);
  const del = useServerFn(adminDeleteArtwork);
  const isAdminFn = useServerFn(adminIsAdmin);
  const claim = useServerFn(adminClaimIfEmpty);

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [loading, setLoading] = useState(false);

  async function refresh() {
    try {
      const rows = await list();
      setArtworks(rows as Artwork[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  useEffect(() => {
    isAdminFn().then(async (r) => {
      setIsAdmin(r.isAdmin);
      if (r.isAdmin) await refresh();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onClaim() {
    try {
      await claim();
      toast.success("Você agora é administrador.");
      setIsAdmin(true);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await save({
        data: {
          ...form,
          year: Number(form.year),
          width_cm: Number(form.width_cm),
          height_cm: Number(form.height_cm),
          price_brl: Number(form.price_brl),
        },
      });
      toast.success(form.id ? "Obra atualizada." : "Obra cadastrada.");
      setForm({ ...emptyForm });
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Excluir esta obra?")) return;
    try {
      await del({ data: { id } });
      toast.success("Obra removida.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  async function onSignOut() {
    await supabase.auth.signOut();
  }

  if (isAdmin === null) return <p className="text-technical">Carregando…</p>;

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="text-technical">Logado como {email}</p>
        <h1 className="mt-3 font-serif text-3xl">Sem permissão</h1>
        <p className="mt-4 text-foreground/80">
          Esta conta ainda não é administradora. Se você é a primeira pessoa a
          entrar no ateliê, clique abaixo para se promover.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={onClaim} className="bg-primary px-4 py-2 text-primary-foreground hover:opacity-90">
            Sou o(a) administrador(a)
          </button>
          <button onClick={onSignOut} className="border border-border px-4 py-2 text-technical">
            Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between border-b border-border pb-3">
        <div>
          <p className="text-technical">Painel do ateliê</p>
          <h1 className="mt-2 font-serif text-3xl">Gerenciar obras</h1>
        </div>
        <div className="flex items-center gap-3 text-technical">
          <span>{email}</span>
          <button onClick={onSignOut} className="border border-border px-3 py-1 hover:border-foreground">
            Sair
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr]">
        {/* Form */}
        <form onSubmit={onSave} className="space-y-4 border border-border p-5">
          <p className="text-technical">{form.id ? "Editar obra" : "Nova obra"}</p>

          <TextField label="Título" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <TextField label="Técnica" value={form.technique} onChange={(v) => setForm({ ...form, technique: v })} placeholder="Aquarela, nanquim…" />
          <div className="grid grid-cols-3 gap-3">
            <NumberField label="Ano" value={form.year} onChange={(v) => setForm({ ...form, year: v })} />
            <NumberField label="Largura (cm)" value={form.width_cm} onChange={(v) => setForm({ ...form, width_cm: v })} />
            <NumberField label="Altura (cm)" value={form.height_cm} onChange={(v) => setForm({ ...form, height_cm: v })} />
          </div>
          <NumberField label="Preço (BRL)" value={form.price_brl} onChange={(v) => setForm({ ...form, price_brl: v })} step={1} />
          <TextArea label="Descrição" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
          <TextField
            label="URL da imagem de preview"
            value={form.preview_url}
            onChange={(v) => setForm({ ...form, preview_url: v })}
            placeholder="https://… (imagem com marca d'água)"
          />
          <TextField
            label="Caminho do original no storage (bucket 'originals')"
            value={form.original_path}
            onChange={(v) => setForm({ ...form, original_path: v })}
            placeholder="ex.: fachada.tif"
          />
          <label className="flex items-center gap-2 text-technical">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            Publicada na galeria
          </label>

          <div className="flex gap-3 pt-2">
            <button disabled={loading} className="bg-primary px-5 py-2 text-primary-foreground hover:opacity-90 disabled:opacity-60">
              {loading ? "…" : form.id ? "Salvar" : "Cadastrar"}
            </button>
            {form.id && (
              <button type="button" onClick={() => setForm({ ...emptyForm })} className="border border-border px-4 py-2 text-technical">
                Cancelar
              </button>
            )}
          </div>
        </form>

        {/* List */}
        <div className="space-y-3">
          <p className="text-technical">{artworks.length} obras no ateliê</p>
          {artworks.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-4 border border-border p-4">
              <div className="min-w-0">
                <p className="font-serif text-lg leading-tight">{a.title}</p>
                <p className="text-technical mt-1">
                  {a.technique} · {a.year} · {a.width_cm}×{a.height_cm} cm · {formatBRL(a.price_brl)}
                  {!a.published && " · rascunho"}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() =>
                    setForm({
                      id: a.id,
                      title: a.title,
                      technique: a.technique,
                      year: a.year,
                      width_cm: a.width_cm,
                      height_cm: a.height_cm,
                      description: a.description,
                      price_brl: a.price_brl,
                      preview_url: a.preview_url,
                      original_path: a.original_path,
                      published: a.published,
                    })
                  }
                  className="border border-border px-3 py-1 text-technical hover:border-foreground"
                >
                  Editar
                </button>
                <button onClick={() => onDelete(a.id)} className="border border-border px-3 py-1 text-technical hover:border-destructive hover:text-destructive">
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 border border-dashed border-border p-5">
        <p className="text-technical">Configuração de pagamentos</p>
        <p className="mt-2 text-sm text-foreground/80">
          Para ativar o Mercado Pago, adicione os segredos abaixo em{" "}
          <strong>Project Settings → Secrets</strong>:
        </p>
        <ul className="mt-3 space-y-1 font-mono text-xs">
          <li>· <strong>MERCADO_PAGO_ACCESS_TOKEN</strong> — token de acesso (produção ou sandbox)</li>
          <li>· <strong>MERCADO_PAGO_WEBHOOK_SECRET</strong> — opcional, para validar assinatura</li>
          <li>· <strong>PUBLIC_BASE_URL</strong> — ex.: https://seu-dominio.lovable.app</li>
        </ul>
        <p className="mt-3 text-technical">
          Webhook URL para configurar no painel do Mercado Pago:{" "}
          <span className="font-mono normal-case">
            {typeof window !== "undefined" ? `${window.location.origin}/api/public/mp-webhook` : "/api/public/mp-webhook"}
          </span>
        </p>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-technical">{label}</span>
      <input
        type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-border bg-background px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
      />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-technical">{label}</span>
      <textarea
        rows={4} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
    </label>
  );
}

function NumberField({ label, value, onChange, step = 0.5 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="block">
      <span className="text-technical">{label}</span>
      <input
        type="number" step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full border border-border bg-background px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
      />
    </label>
  );
}
