import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

import { Header, Footer } from "@/components/Header";
import { ArtworkCard, type Artwork } from "@/components/ArtworkCard";

export const listArtworks = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, storage: undefined } },
  );
  const { data, error } = await supabase
    .from("artworks")
    .select("id,title,technique,year,width_cm,height_cm,price_brl,preview_url,published")
    .eq("published", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Artwork[];
});

const artworksQuery = queryOptions({
  queryKey: ["artworks"],
  queryFn: () => listArtworks(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ateliê da Ana · Galeria de obras originais" },
      {
        name: "description",
        content:
          "Galeria de obras originais da artista e arquiteta Ana. Traço técnico e aquarelas orgânicas.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(artworksQuery),
  component: Home,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-technical">Falha ao carregar obras: {error.message}</div>
  ),
});

function Home() {
  const { data: artworks } = useSuspenseQuery(artworksQuery);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="relative">
        {/* Blueprint background */}
        <div className="blueprint-grid-fine absolute inset-0 -z-10 opacity-60" aria-hidden />

        <section className="mx-auto max-w-6xl px-6 pt-16 pb-12">
          <p className="text-technical">Ateliê · Est. 2024 · São Paulo</p>
          <h1 className="mt-4 font-serif text-5xl leading-[1.05] text-foreground md:text-6xl">
            Obras originais entre o traço<br />
            arquitetônico e a aquarela.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/80">
            Ana é arquiteta e artista. No ateliê, o rigor do desenho técnico
            encontra a liberdade da aquarela — cada obra é única, assinada, e
            entregue com certificado de autoria. Aqui você encontra a coleção
            atual, disponível para compra e download em alta resolução.
          </p>
          <div className="mt-8 flex items-center gap-4 text-technical">
            <span className="inline-block h-px w-12 bg-technical" />
            <span>Escala 1:1 · Edições únicas</span>
          </div>
        </section>

        {/* About Ana */}
        <section className="mx-auto max-w-6xl px-6 pb-12">
          <div className="grid grid-cols-1 items-start gap-10 border-b border-border pb-12 md:grid-cols-2 md:items-center">
            <div className="order-2 md:order-1">
              <p className="text-technical">Sobre a artista</p>
              <h2 className="mt-3 font-serif text-3xl text-foreground md:text-4xl">
                Sobre a Ana
              </h2>
              <p className="mt-5 leading-relaxed text-foreground/80">
                Ana é arquiteta e artista. Seu trabalho nasce da observação do
                espaço construído — linhas, plantas, cortes — e se transforma em
                peças que misturam o rigor técnico do desenho arquitetônico com a
                liberdade da pintura. Cada obra é única e vendida em edição limitada.
              </p>
              <div className="mt-6 flex items-center gap-4 text-technical">
                <span className="inline-block h-px w-12 bg-technical" />
                <span>Arquitetura · Aquarela · Traço</span>
              </div>
            </div>

            <div className="order-1 md:order-2">
              <div className="relative aspect-[4/5] w-full border border-dashed border-border bg-muted/30">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <div className="h-px w-16 bg-primary" />
                  <p className="text-technical">Foto da Ana</p>
                  <p className="max-w-[16rem] text-sm text-muted-foreground">
                    Espaço reservado para uma foto do ateliê ou da artista.
                  </p>
                  <div className="h-px w-16 bg-primary" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="mb-8 flex items-baseline justify-between border-b border-border pb-3">
            <h2 className="font-serif text-2xl text-foreground">Coleção atual</h2>
            <span className="text-technical">
              {String(artworks.length).padStart(2, "0")} obras · atualizado hoje
            </span>
          </div>

          {artworks.length === 0 ? (
            <div className="border border-dashed border-border p-16 text-center">
              <p className="text-technical">Nenhuma obra publicada no momento.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Acesse o Ateliê para cadastrar novas obras.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {artworks.map((a) => (
                <ArtworkCard key={a.id} artwork={a} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
