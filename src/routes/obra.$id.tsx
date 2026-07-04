import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";

import { Header, Footer } from "@/components/Header";
import { BlueprintFrame } from "@/components/BlueprintFrame";
import { formatBRL, formatDim } from "@/lib/format";
import { createCheckoutPreference } from "@/lib/mp.functions";

const getArtwork = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false, storage: undefined } },
    );
    const { data: art, error } = await supabase
      .from("artworks")
      .select("id,title,technique,year,width_cm,height_cm,description,price_brl,preview_url,published")
      .eq("id", data.id)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!art) return null;
    return art as any;
  });

const artworkQuery = (id: string) =>
  queryOptions({
    queryKey: ["artwork", id],
    queryFn: () => getArtwork({ data: { id } }),
  });

export const Route = createFileRoute("/obra/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(artworkQuery(params.id)),
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} · Ateliê da Ana` },
          { name: "description", content: `${loaderData.title} — ${loaderData.technique}, ${loaderData.year}.` },
          { property: "og:title", content: `${loaderData.title} · Ateliê da Ana` },
          { property: "og:description", content: `${loaderData.technique}, ${loaderData.year}. Obra original disponível.` },
          { property: "og:image", content: loaderData.preview_url },
        ]
      : [{ title: "Obra não encontrada · Ateliê da Ana" }, { name: "robots", content: "noindex" }],
  }),
  component: ArtworkPage,
  notFoundComponent: () => <NotFound />,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-technical">Erro: {error.message}</div>
  ),
});

function NotFound() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="text-technical">Obra não encontrada</p>
        <h1 className="mt-4 font-serif text-4xl">Essa obra não está mais disponível</h1>
        <Link to="/" className="mt-8 inline-block border border-foreground px-4 py-2 text-technical hover:bg-foreground hover:text-background">
          Ver galeria
        </Link>
      </div>
    </div>
  );
}

function ArtworkPage() {
  const { data: art } = useSuspenseQuery(artworkQuery(Route.useParams().id));
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const createPref = useServerFn(createCheckoutPreference);

  if (!art) return <NotFound />;

  const w = Number(art.width_cm);
  const h = Number(art.height_cm);

  async function onBuy(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z.string().trim().email().safeParse(email);
    if (!parsed.success) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    setLoading(true);
    try {
      const res = await createPref({ data: { artworkId: art.id, email: parsed.data } });
      if (res.mock) {
        toast.message("Modo de teste: Mercado Pago não configurado.", {
          description: "Simulando redirecionamento para a página de retorno.",
        });
        navigate({ to: res.init_point as any });
      } else {
        window.location.href = res.init_point;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao iniciar pagamento.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Link to="/" className="text-technical hover:text-primary">← Voltar à galeria</Link>

        <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr]">
          {/* Imagem */}
          <div>
            <BlueprintFrame label={`FICHA · ${art.id.slice(0, 6).toUpperCase()}`}>
              <div
                className="protected-image-wrapper watermark relative aspect-[4/5] overflow-hidden bg-white"
                onContextMenu={(e) => e.preventDefault()}
              >
                <img
                  src={art.preview_url}
                  alt={art.title}
                  width={1200}
                  height={1500}
                  className="protected-image h-full w-full object-contain"
                  draggable={false}
                />
              </div>
            </BlueprintFrame>
            <p className="mt-3 text-technical">
              Preview em baixa resolução com marca d'água — o arquivo original é liberado após o pagamento.
            </p>
          </div>

          {/* Ficha técnica + compra */}
          <div>
            <p className="text-technical">Obra original · Ed. única</p>
            <h1 className="mt-3 font-serif text-4xl leading-tight text-foreground">{art.title}</h1>

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-y border-border py-5">
              <dt className="text-technical">Técnica</dt>
              <dd className="font-mono text-sm">{art.technique}</dd>
              <dt className="text-technical">Ano</dt>
              <dd className="font-mono text-sm">{art.year}</dd>
              <dt className="text-technical">Dimensões</dt>
              <dd className="font-mono text-sm">{formatDim(w, h)}</dd>
              <dt className="text-technical">Assinada</dt>
              <dd className="font-mono text-sm">Sim, no verso</dd>
            </dl>

            <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
              {art.description || "Sem descrição disponível."}
            </p>

            <div className="mt-8 border border-border p-5">
              <div className="flex items-baseline justify-between">
                <span className="text-technical">Preço</span>
                <span className="font-mono text-2xl text-primary">{formatBRL(art.price_brl)}</span>
              </div>
              <form onSubmit={onBuy} className="mt-5 space-y-3">
                <label className="block">
                  <span className="text-technical">E-mail para envio do arquivo</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                    className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none"
                  />
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary py-3 text-sm font-medium tracking-wide text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  {loading ? "Redirecionando…" : "Comprar via Mercado Pago"}
                </button>
                <p className="text-technical text-center">
                  Pix · Cartão de crédito · Checkout seguro no Mercado Pago
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
