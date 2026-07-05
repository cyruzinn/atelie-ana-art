/**
 * Geração de imagens de preview com marca d'água a partir do arquivo original.
 *
 * Roda 100% no navegador (Canvas API) — não precisa de dependência nativa
 * (sharp/canvas não funcionam no runtime Worker do Lovable Cloud).
 *
 * Fluxo previsto no /admin:
 *   1. artista escolhe o arquivo original (JPG/PNG de alta resolução);
 *   2. `generateWatermarkedPreview(file)` devolve um Blob JPEG reduzido
 *      com marca d'água diagonal repetida;
 *   3. o admin faz upload desse Blob no bucket público `previews`
 *      e do original no bucket privado `originals`.
 */

export interface WatermarkOptions {
  /** Lado maior do preview, em px. Padrão 1400. */
  maxSize?: number;
  /** Texto da marca d'água. */
  text?: string;
  /** Qualidade JPEG (0–1). Padrão 0.82. */
  quality?: number;
  /** Opacidade do texto (0–1). Padrão 0.18. */
  opacity?: number;
}

const DEFAULTS: Required<WatermarkOptions> = {
  maxSize: 1400,
  text: "ATELIÊ DA ANA · PREVIEW",
  quality: 0.82,
  opacity: 0.18,
};

async function fileToImage(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    // libera depois — se o browser ainda estiver decodificando o revoke
    // imediato pode cortar; pequeno delay é seguro
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

/**
 * Recebe um arquivo de imagem (File/Blob) e devolve um Blob JPEG
 * redimensionado com marca d'água diagonal repetida em toda a área.
 */
export async function generateWatermarkedPreview(
  file: Blob,
  options: WatermarkOptions = {},
): Promise<Blob> {
  if (typeof window === "undefined") {
    throw new Error("generateWatermarkedPreview só roda no navegador.");
  }
  const opts = { ...DEFAULTS, ...options };
  const img = await fileToImage(file);

  // 1. redimensiona mantendo proporção
  const scale = Math.min(1, opts.maxSize / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D não disponível.");

  ctx.drawImage(img, 0, 0, w, h);

  // 2. camada de marca d'água diagonal repetida
  const fontPx = Math.max(14, Math.round(Math.min(w, h) * 0.028));
  ctx.save();
  ctx.globalAlpha = opts.opacity;
  ctx.fillStyle = "#2E2C2A";
  ctx.font = `${fontPx}px "JetBrains Mono", ui-monospace, monospace`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  // gira o canvas -22° e desenha a grade de texto cobrindo a área
  const angle = (-22 * Math.PI) / 180;
  ctx.translate(w / 2, h / 2);
  ctx.rotate(angle);

  const diag = Math.sqrt(w * w + h * h);
  const stepX = Math.round(ctx.measureText(opts.text).width * 1.6);
  const stepY = Math.round(fontPx * 6);
  const cols = Math.ceil(diag / stepX) + 2;
  const rows = Math.ceil(diag / stepY) + 2;

  for (let r = -rows; r <= rows; r++) {
    for (let c = -cols; c <= cols; c++) {
      ctx.fillText(opts.text, c * stepX, r * stepY);
    }
  }
  ctx.restore();

  // 3. exporta como JPEG
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Falha ao gerar preview."))),
      "image/jpeg",
      opts.quality,
    );
  });
  return blob;
}
