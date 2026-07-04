import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Header, Footer } from "@/components/Header";
import { getDownloadUrl } from "@/lib/mp.functions";

export const Route = createFileRoute("/download/$token")({
  head: () => ({ meta: [{ title: "Download · Ateliê da Ana" }, { name: "robots", content: "noindex" }] }),
  component: DownloadPage,
});

function DownloadPage() {
  const { token } = Route.useParams();
  const fetchUrl = useServerFn(getDownloadUrl);
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "ready"; url: string; title: string; remaining: number }
    | { kind: "error"; msg: string }
  >({ kind: "idle" });

  async function onGetLink() {
    setState({ kind: "loading" });
    try {
      const res = await fetchUrl({ data: { token } });
      setState({ kind: "ready", url: res.url, title: res.title, remaining: res.uses_remaining });
      window.location.href = res.url;
    } catch (err) {
      setState({ kind: "error", msg: err instanceof Error ? err.message : "Erro" });
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-technical">Área protegida</p>
        <h1 className="mt-4 font-serif text-4xl text-foreground">Baixe sua obra</h1>
        <p className="mt-6 text-foreground/80">
          Este link é temporário: válido por 1 hora e limitado a poucos
          downloads. Guarde o arquivo original em um local seguro.
        </p>

        {state.kind === "idle" && (
          <button
            onClick={onGetLink}
            className="mt-8 bg-primary px-6 py-3 text-primary-foreground hover:opacity-90"
          >
            Gerar link de download
          </button>
        )}
        {state.kind === "loading" && <p className="mt-8 text-technical">Preparando arquivo…</p>}
        {state.kind === "ready" && (
          <div className="mt-8 space-y-4">
            <p className="text-technical">Downloads restantes: {state.remaining}</p>
            <a href={state.url} className="inline-block bg-primary px-6 py-3 text-primary-foreground hover:opacity-90">
              Baixar {state.title}
            </a>
          </div>
        )}
        {state.kind === "error" && (
          <div className="mt-8">
            <p className="text-destructive">{state.msg}</p>
            <Link to="/" className="mt-6 inline-block text-technical hover:text-primary">
              ← Voltar à galeria
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
