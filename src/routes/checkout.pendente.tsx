import { createFileRoute, Link } from "@tanstack/react-router";
import { Header, Footer } from "@/components/Header";

export const Route = createFileRoute("/checkout/pendente")({
  head: () => ({ meta: [{ title: "Pagamento pendente · Ateliê da Ana" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-technical">Status · Aguardando</p>
        <h1 className="mt-4 font-serif text-4xl text-foreground">Pagamento em análise</h1>
        <p className="mt-6 text-foreground/80">
          Seu pagamento ainda está sendo processado pelo Mercado Pago. Assim que
          for aprovado, enviaremos o link de download por e-mail — geralmente em
          poucos minutos no Pix e em algumas horas no cartão.
        </p>
        <Link to="/" className="mt-8 inline-block border border-foreground px-5 py-2 text-technical hover:bg-foreground hover:text-background">
          Voltar à galeria
        </Link>
      </main>
      <Footer />
    </div>
  ),
});
