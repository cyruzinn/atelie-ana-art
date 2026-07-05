import { Link } from "@tanstack/react-router";
import { formatBRL, formatDim } from "@/lib/format";
import { ProtectedImage } from "@/components/ProtectedImage";


export interface Artwork {
  id: string;
  title: string;
  technique: string;
  year: number;
  width_cm: number | string;
  height_cm: number | string;
  price_brl: number | string;
  preview_url: string;
}

export function ArtworkCard({ artwork }: { artwork: Artwork }) {
  const w = Number(artwork.width_cm);
  const h = Number(artwork.height_cm);
  return (
    <Link
      to="/obra/$id"
      params={{ id: artwork.id }}
      className="group block"
    >
      <article className="relative">
        {/* Cotas (dimensões técnicas) — aparecem no hover */}
        <div className="pointer-events-none mb-3 flex h-4 items-center gap-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="text-technical shrink-0">L {w} cm</span>
          <div className="dimension-line flex-1" />
        </div>

        <div className="relative">
          {/* wrapper protection */}
          <div
            className="protected-image-wrapper relative aspect-[4/5] overflow-hidden border border-border bg-white watermark"
            onContextMenu={(e) => e.preventDefault()}
          >
            <img
              src={artwork.preview_url}
              alt={artwork.title}
              loading="lazy"
              width={800}
              height={1000}
              className="protected-image h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              draggable={false}
            />
          </div>

          {/* Cota vertical (altura) — lado direito */}
          <div className="pointer-events-none absolute -right-6 top-0 hidden h-full flex-col items-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:flex">
            <span className="text-technical mb-2">A</span>
            <div className="dimension-line w-px flex-1" style={{ height: "100%", width: 1 }} />
            <span className="text-technical mt-2">{h}</span>
          </div>
        </div>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-serif text-lg leading-tight text-foreground">
              {artwork.title}
            </h3>
            <p className="text-technical mt-1">
              {artwork.technique} · {artwork.year} · {formatDim(w, h)}
            </p>
          </div>
          <p className="font-mono text-sm font-medium text-primary shrink-0">
            {formatBRL(artwork.price_brl)}
          </p>
        </div>
      </article>
    </Link>
  );
}
