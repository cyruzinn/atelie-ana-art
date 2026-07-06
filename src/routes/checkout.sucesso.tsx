import { createFileRoute, Link } from "@tanstack/react-router";
import { Header, Footer } from "@/components/Header";

export const Route = createFileRoute("/checkout/sucesso")({
  head: () => ({ meta: [{ title: "Pagamento aprovado · Ateliê da Ana" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-technical">Status · Aprovado</p>
        <h1 className="mt-4 font-serif text-5xl text-foreground">Obrigada ✷</h1>
        <p className="mt-6 text-base text-foreground/80">
          Seu pagamento foi aprovado. Em instantes você receberá no e-mail
          informado um link protegido para baixar o arquivo original em alta
          resolução — o link é válido por 1 hora e permite até 3 downloads.
        </p>
        <p className="mt-4 text-technical">
          Se o e-mail não chegar em 5 minutos, verifique a caixa de spam.
        </p>
        <Link to="/" className="mt-8 inline-block border border-foreground px-5 py-2 text-technical hover:bg-foreground hover:text-background">
          Voltar à galeria
        </Link>
      </main>
      <Footer />
    </div>
  ),
});
