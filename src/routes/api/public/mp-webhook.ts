import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { randomBytes } from "crypto";

/**
 * Mercado Pago webhook (server-to-server).
 * Verifica o status do pagamento diretamente na API do Mercado Pago
 * e só então marca o pedido como pago + gera token de download.
 */
export const Route = createFileRoute("/api/public/mp-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
        if (!accessToken) {
          console.error("[mp-webhook] MERCADO_PAGO_ACCESS_TOKEN não configurado");
          return new Response("Not configured", { status: 503 });
        }

        const rawBody = await request.text();

        // Assinatura opcional (Mercado Pago envia x-signature quando configurado)
        const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
        if (secret) {
          const sigHeader = request.headers.get("x-signature") ?? "";
          const requestId = request.headers.get("x-request-id") ?? "";
          const parts = Object.fromEntries(
            sigHeader.split(",").map((p) => {
              const [k, v] = p.split("=");
              return [k?.trim(), v?.trim()];
            }),
          );
          const ts = parts.ts;
          const v1 = parts.v1;
          const url = new URL(request.url);
          const dataId = url.searchParams.get("data.id") ?? "";
          if (ts && v1 && dataId) {
            const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
            const expected = createHmac("sha256", secret).update(manifest).digest("hex");
            try {
              const a = Buffer.from(v1);
              const b = Buffer.from(expected);
              if (a.length !== b.length || !timingSafeEqual(a, b)) {
                return new Response("Invalid signature", { status: 401 });
              }
            } catch {
              return new Response("Invalid signature", { status: 401 });
            }
          }
        }

        let payload: any = {};
        try {
          payload = JSON.parse(rawBody);
        } catch {
          // Mercado Pago às vezes usa query params para IPN antigo
        }

        const url = new URL(request.url);
        const paymentId =
          payload?.data?.id ||
          url.searchParams.get("data.id") ||
          url.searchParams.get("id");
        const type = payload?.type || url.searchParams.get("type") || "";

        if (!paymentId || (type && type !== "payment")) {
          return new Response("ignored", { status: 200 });
        }

        // Buscar status real na API do Mercado Pago
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!mpRes.ok) {
          console.error("[mp-webhook] falha ao buscar pagamento", mpRes.status);
          return new Response("mp error", { status: 502 });
        }
        const payment = (await mpRes.json()) as any;

        if (payment.status !== "approved") {
          // marca pendente/falha mas não gera token
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          if (payment.external_reference) {
            await supabaseAdmin
              .from("orders")
              .update({
                status: payment.status,
                mp_payment_id: String(payment.id),
              })
              .eq("id", payment.external_reference);
          }
          return new Response("ok", { status: 200 });
        }

        // Aprovado — libera download
        const orderId = payment.external_reference as string;
        if (!orderId) return new Response("no ref", { status: 200 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: existing } = await supabaseAdmin
          .from("orders")
          .select("id,status,buyer_email,artwork_id")
          .eq("id", orderId)
          .maybeSingle();
        if (!existing) return new Response("no order", { status: 200 });

        // Idempotência: se já pago, não gerar segundo token
        if ((existing as any).status === "paid") {
          return new Response("already paid", { status: 200 });
        }

        await supabaseAdmin
          .from("orders")
          .update({
            status: "paid",
            mp_payment_id: String(payment.id),
            paid_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        const token = randomBytes(24).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        await supabaseAdmin.from("download_tokens").insert({
          token,
          order_id: orderId,
          expires_at: expiresAt,
          uses_remaining: 3,
        });

        // Enviar e-mail com link (usa Lovable Emails se disponível; caso contrário loga)
        const site = process.env.PUBLIC_BASE_URL || "";
        const downloadUrl = `${site}/download/${token}`;
        try {
          const { data: art } = await supabaseAdmin
            .from("artworks")
            .select("title")
            .eq("id", (existing as any).artwork_id)
            .single();
          const buyerEmail = (existing as any).buyer_email as string;
          const title = (art as any)?.title ?? "sua obra";
          // Tenta enfileirar via RPC enqueue_email (Lovable Emails). Se não existir, apenas loga.
          const { error: emailErr } = await supabaseAdmin.rpc("enqueue_email" as any, {
            queue: "transactional_emails",
            payload: {
              to: buyerEmail,
              subject: `Seu link de download — ${title}`,
              html: renderEmail(title, downloadUrl),
            },
          } as any);
          if (emailErr) {
            console.log("[mp-webhook] email não enfileirado (Emails não habilitado):", emailErr.message);
            console.log("[mp-webhook] link manual:", downloadUrl);
          }
        } catch (e) {
          console.log("[mp-webhook] email skipped:", (e as Error).message);
        }

        return new Response("ok", { status: 200 });
      },

      // Alguns setups do MP enviam GET para IPN legado
      GET: async ({ request }) => {
        const url = new URL(request.url);
        console.log("[mp-webhook] GET ping", url.search);
        return new Response("ok", { status: 200 });
      },
    },
  },
});

function renderEmail(title: string, url: string): string {
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#2E2C2A;max-width:520px;margin:0 auto;padding:24px">
    <p style="letter-spacing:.1em;font-size:12px;text-transform:uppercase;color:#B85C74">Ateliê da Ana</p>
    <h1 style="font-family:Georgia,serif;font-weight:400">Obrigada pela compra ✷</h1>
    <p>Sua obra <strong>${title}</strong> está liberada. Use o link abaixo para baixar o arquivo original em alta resolução.</p>
    <p style="margin:24px 0">
      <a href="${url}" style="background:#D9738A;color:#fff;padding:12px 20px;text-decoration:none;display:inline-block">Baixar arquivo</a>
    </p>
    <p style="font-size:13px;color:#6b6b6b">O link expira em 1 hora e permite até 3 downloads.</p>
  </body></html>`;
}
