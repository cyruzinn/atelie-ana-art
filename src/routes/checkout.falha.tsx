import { createFileRoute, Link } from "@tanstack/react-router";
import { Header, Footer } from "@/components/Header";

export const Route = createFileRoute("/checkout/falha")({
  head: () => ({ meta: [{ title: "Pagamento não concluído · Ateliê da Ana" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-technical">Status · Falha</p>
        <h1 className="mt-4 font-serif text-4xl text-foreground">Pagamento não concluído</h1>
        <p className="mt-6 text-foreground/80">
          O Mercado Pago não conseguiu processar seu pagamento. Nenhum valor foi
          cobrado. Você pode tentar novamente pela página da obra.
        </p>
        <Link to="/" className="mt-8 inline-block border border-foreground px-5 py-2 text-technical hover:bg-foreground hover:text-background">
          Voltar à galeria
        </Link>
      </main>
      <Footer />
    </div>
  ),
});
