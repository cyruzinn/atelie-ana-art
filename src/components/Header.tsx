import { Link } from "@tanstack/react-router";

export function Header() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl items-baseline justify-between px-6 py-6">
        <Link to="/" className="group flex items-baseline gap-3">
          <span className="font-serif text-2xl tracking-tight text-foreground">
            Ateliê da Ana
          </span>
          <span className="text-technical hidden sm:inline">
            Escala 1:1 · Obras originais
          </span>
        </Link>
        <nav className="flex items-baseline gap-6 text-technical">
          <Link to="/" activeOptions={{ exact: true }} className="hover:text-primary [&.active]:text-primary">
            Galeria
          </Link>
          <Link to="/admin" className="hover:text-primary [&.active]:text-primary">
            Ateliê
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-technical">
          © {new Date().getFullYear()} Ateliê da Ana · Todos os direitos reservados
        </p>
        <p className="text-technical">
          Pagamentos via Mercado Pago · Pix · Cartão
        </p>
      </div>
    </footer>
  );
}
