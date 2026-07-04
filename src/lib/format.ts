export function formatBRL(v: number | string): string {
  const n = typeof v === "string" ? Number(v) : v;
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export function formatDim(w: number | string, h: number | string): string {
  return `${Number(w).toString().replace(".", ",")} × ${Number(h).toString().replace(".", ",")} cm`;
}
