import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

const emailSchema = z.string().trim().email().max(255);

function baseUrl(): string {
  return process.env.PUBLIC_BASE_URL || "http://localhost:8080";
}

// ---- Create checkout preference ----
export const createCheckoutPreference = createServerFn({ method: "POST" })
  .inputValidator((data: { artworkId: string; email: string }) =>
    z.object({ artworkId: z.string().uuid(), email: emailSchema }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: art, error } = await supabaseAdmin
      .from("artworks")
      .select("id,title,price_brl,published")
      .eq("id", data.artworkId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!art || !(art as any).published) throw new Error("Obra não disponível.");

    const amount = Number((art as any).price_brl);

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        artwork_id: data.artworkId,
        buyer_email: data.email,
        status: "pending",
        amount_brl: amount,
      })
      .select("id")
      .single();
    if (orderErr) throw new Error(orderErr.message);

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const site = baseUrl();

    // Se o token do Mercado Pago não estiver configurado, retornamos uma URL
    // "mock" para permitir testar o fluxo sem chaves reais. Basta preencher
    // MERCADO_PAGO_ACCESS_TOKEN em Project Settings → Secrets para ativar.
    if (!accessToken) {
      return {
        init_point: `${site}/checkout/sucesso?mock=1&order=${(order as any).id}`,
        mock: true,
      };
    }

    const preferenceBody = {
      items: [
        {
          id: (art as any).id,
          title: (art as any).title,
          quantity: 1,
          currency_id: "BRL",
          unit_price: amount,
        },
      ],
      payer: { email: data.email },
      external_reference: (order as any).id,
      back_urls: {
        success: `${site}/checkout/sucesso?order=${(order as any).id}`,
        pending: `${site}/checkout/pendente?order=${(order as any).id}`,
        failure: `${site}/checkout/falha?order=${(order as any).id}`,
      },
      auto_return: "approved",
      notification_url: `${site}/api/public/mp-webhook`,
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }, { id: "atm" }],
      },
    };

    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preferenceBody),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("MP preference error", res.status, txt);
      throw new Error("Falha ao criar checkout no Mercado Pago.");
    }
    const pref = (await res.json()) as { id: string; init_point: string; sandbox_init_point?: string };

    await supabaseAdmin
      .from("orders")
      .update({ mp_preference_id: pref.id })
      .eq("id", (order as any).id);

    return {
      init_point: pref.sandbox_init_point || pref.init_point,
      mock: false,
    };
  });

// ---- Get a signed download URL from a token ----
export const getDownloadUrl = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string }) =>
    z.object({ token: z.string().min(16).max(128) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: tok, error } = await supabaseAdmin
      .from("download_tokens")
      .select("token,order_id,expires_at,uses_remaining")
      .eq("token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!tok) throw new Error("Link inválido.");

    const t = tok as any;
    if (new Date(t.expires_at) < new Date()) throw new Error("Link expirado.");
    if (t.uses_remaining <= 0) throw new Error("Limite de downloads atingido.");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id,status,artwork_id")
      .eq("id", t.order_id)
      .single();
    const ord = order as any;
    if (!ord || ord.status !== "paid") throw new Error("Pagamento não confirmado.");

    const { data: art } = await supabaseAdmin
      .from("artworks")
      .select("title,original_path")
      .eq("id", ord.artwork_id)
      .single();
    const a = art as any;
    if (!a?.original_path) throw new Error("Arquivo original não disponível.");

    const { data: signed, error: sErr } = await supabaseAdmin
      .storage.from("originals")
      .createSignedUrl(a.original_path, 300, { download: `${a.title}.jpg` });
    if (sErr || !signed) throw new Error("Falha ao gerar link.");

    await supabaseAdmin
      .from("download_tokens")
      .update({ uses_remaining: t.uses_remaining - 1 })
      .eq("token", data.token);

    return { url: signed.signedUrl, title: a.title, uses_remaining: t.uses_remaining - 1 };
  });

// ---- Helpers exported for the webhook ----
export function generateDownloadToken(): string {
  return randomBytes(24).toString("hex");
}
