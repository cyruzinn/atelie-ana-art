# Ateliê da Ana — Plano de implementação

E-commerce de obras de arte originais com estética "prancheta de arquiteto". Backend com Lovable Cloud (Supabase), checkout Mercado Pago via Checkout Pro, downloads protegidos com links temporários por e-mail.

## Arquitetura

- **Frontend**: TanStack Start (rotas por arquivo em `src/routes/`).
- **Backend**: Lovable Cloud (Supabase) — banco `artworks`, `orders`, `download_tokens`; storage com dois buckets (`previews` público e `originals` privado); autenticação simples e-mail/senha para o painel admin.
- **Pagamentos**: Mercado Pago Checkout Pro. Segredos (`MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET`) ficam em Project Settings → Secrets, você preenche depois.
- **E-mails**: Lovable Emails (habilitado junto com Cloud), template com o link de download.

## Design System (`src/styles.css`)

Tokens semânticos em oklch:
- `--background` (#FFFFFF), `--foreground` (#2E2C2A)
- `--accent-pink` (#D9738A), `--accent-pink-deep` (#B85C74)
- `--grid-line` (#ECE8E6)
- Fontes: Fraunces (títulos), Work Sans (corpo), JetBrains Mono (técnicas/preços) via `<link>` no `__root.tsx`.
- Utilitário `.blueprint-grid` — fundo com linhas cinza sutis 24px.
- Componente card com hover que revela "cotas" (setas ◄ ► com dimensões em mono).

## Rotas

```
src/routes/
  __root.tsx              # fontes + header/footer + toaster
  index.tsx               # galeria pública (grid 3 col)
  obra.$id.tsx            # página do produto (form de e-mail → checkout)
  checkout.sucesso.tsx    # retorno success MP
  checkout.pendente.tsx   # retorno pending MP
  checkout.falha.tsx      # retorno failure MP
  download.$token.tsx     # valida token, serve URL assinada do original
  admin.tsx               # login (se não autenticado) + painel CRUD obras
  api/public/mp-webhook.ts  # webhook Mercado Pago
  api/public/mp-create-preference.ts  # cria preference (chamado pelo cliente)
```

## Server functions e rotas

- `createPreference({ artworkId, email })` — server fn: cria row em `orders` (status pending), chama API MP para criar preference, retorna `init_point`.
- `api/public/mp-webhook` — recebe notificação, busca pagamento na API MP (fonte de verdade), se `approved` marca order pago, gera token de download (expira 1h, max 3 usos), envia e-mail.
- `getDownloadUrl({ token })` — server fn: valida token (expiração, usos), incrementa contador, retorna signed URL do bucket privado (TTL curto).
- Admin CRUD: server fns protegidas (`requireSupabaseAuth` + role check) para inserir/editar/deletar obras e fazer upload de imagens.

## Banco de dados

```sql
artworks (id, title, technique, year, width_cm, height_cm, description, price_brl, preview_path, original_path, created_at)
orders (id, artwork_id, buyer_email, status, mp_preference_id, mp_payment_id, created_at, paid_at)
download_tokens (token, order_id, expires_at, uses_remaining, created_at)
user_roles (user_id, role)  -- admin
```
Grants + RLS: `artworks` SELECT público; `orders`/`download_tokens` só service_role; admin gerencia obras via server fn com role check.

## Proteção das previews

- Imagens no bucket público com watermark (você envia depois; por ora placeholders com overlay CSS de marca d'água textual).
- `onContextMenu={e => e.preventDefault()}`, `user-select: none`, `pointer-events` para bloquear arrastar.

## Painel admin

Rota `/admin`: se não logado, form simples de login (Supabase auth email/senha). Se logado e com role `admin`, lista de obras + form (título, técnica, ano, dimensões, preço, upload preview, upload original).

Semente: 2 obras exemplo (uma "técnica arquitetônica", uma "aquarela orgânica") com placeholders gerados.

## Ordem de execução

1. Habilitar Lovable Cloud.
2. Migração: tabelas, grants, RLS, buckets, role `admin`.
3. Design system + fontes + componentes base (Header, BlueprintGrid, ArtworkCard).
4. Páginas públicas (index, obra).
5. Server fns Mercado Pago + webhook + páginas de retorno.
6. Fluxo de download + e-mail.
7. Painel admin.
8. Seed com 2 obras placeholder.

Segredos que você preenche depois em Settings → Secrets:
- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADO_PAGO_WEBHOOK_SECRET` (opcional; usado para validar `x-signature`)
