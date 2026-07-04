import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-technical">404 · Página não encontrada</p>
        <h1 className="mt-4 font-serif text-4xl text-foreground">Fora do desenho</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Essa página não existe ou foi movida.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center border border-foreground px-4 py-2 text-technical hover:bg-foreground hover:text-background"
        >
          Voltar à galeria
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-technical">Erro</p>
        <h1 className="mt-4 font-serif text-3xl text-foreground">Algo saiu do prumo</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Tente novamente ou volte para a galeria.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="border border-foreground px-4 py-2 text-technical hover:bg-foreground hover:text-background"
          >
            Tentar de novo
          </button>
          <a
            href="/"
            className="border border-border px-4 py-2 text-technical hover:border-foreground"
          >
            Ir para a galeria
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Ateliê da Ana · Obras originais" },
      {
        name: "description",
        content:
          "Ateliê da Ana — galeria de obras originais da artista e arquiteta Ana. Aquarelas orgânicas e desenhos técnicos em edições únicas.",
      },
      { name: "author", content: "Ateliê da Ana" },
      { property: "og:title", content: "Ateliê da Ana · Obras originais" },
      {
        property: "og:description",
        content:
          "Escala 1:1 — obras originais entre o traço arquitetônico e a aquarela.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500&family=Work+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
