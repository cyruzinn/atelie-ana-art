import type { ImgHTMLAttributes, ReactNode } from "react";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "onContextMenu" | "onDragStart"> & {
  /** Aspect wrapper classes (aspect-[4/5], etc.). */
  wrapperClassName?: string;
  /** Show the diagonal "ATELIÊ DA ANA · PREVIEW" watermark overlay. */
  watermark?: boolean;
  overlay?: ReactNode;
};

/**
 * Preview de obra com proteção básica contra cópia casual:
 * - bloqueia menu de contexto (clique direito)
 * - bloqueia arrastar a imagem
 * - bloqueia seleção
 * - overlay transparente sobre a imagem que também intercepta clique direito/arraste
 * - marca d'água CSS (via .watermark)
 *
 * Não substitui uma marca d'água real gravada no pixel (ver src/lib/watermark.ts),
 * mas evita 99% das cópias por usuário comum (arrastar para a área de trabalho,
 * "Salvar imagem como…", seleção + Ctrl+C).
 */
export function ProtectedImage({
  wrapperClassName = "",
  watermark = true,
  overlay,
  className = "",
  alt,
  ...imgProps
}: Props) {
  const block = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  return (
    <div
      className={`protected-image-wrapper relative overflow-hidden bg-white ${
        watermark ? "watermark" : ""
      } ${wrapperClassName}`}
      onContextMenu={block}
      onDragStart={block}
      onMouseDown={(e) => {
        // impede o "arrastar para salvar" em navegadores Chromium
        if (e.button === 0) e.preventDefault();
      }}
    >
      <img
        {...imgProps}
        alt={alt ?? ""}
        draggable={false}
        onContextMenu={block}
        onDragStart={block}
        className={`protected-image h-full w-full ${className}`}
      />
      {/* camada transparente por cima da imagem — captura clique direito
          mesmo em browsers que ignoram pointer-events da img */}
      <div
        aria-hidden
        className="absolute inset-0 select-none"
        onContextMenu={block}
        onDragStart={block}
      />
      {overlay}
    </div>
  );
}
