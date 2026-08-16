# Ana's Art Studio

Crie um site de e-commerce chamado "Ateliê da Ana" — uma loja de obras de arte originais (a Ana é arquiteta e artista, com um estilo que mistura traço técnico/arquitetônico com peças mais soltas/orgânicas como aquarela).

DESIGN (importante seguir exatamente):
- Paleta: fundo branco neutro (#FFFFFF), texto em quase-preto neutro (#2E2C2A / #3A3735), rosa como cor de destaque única (#D9738A para preços/botões/hover, #B85C74 para textos pequenos técnicos como legendas e anotações), linhas de grade/divisórias bem sutis em cinza claro (#ECE8E6).
- Conceito visual: "prancheta de arquiteto" — um grid técnico bem sutil de fundo (linhas finas cinza, tipo papel quadriculado/vegetal), e nos cards de cada obra, ao passar o mouse aparecem "cotas técnicas" (linhas de medida com setas ◄ ► e as dimensões da obra em cm) acima da imagem, como uma anotação de desenho técnico.
- Tipografia: uma serifada elegante para títulos (estilo Fraunces), uma sans-serif limpa para o corpo (estilo Work Sans), e uma monoespaçada técnica para legendas/anotações/preços (estilo JetBrains Mono).
- A moldura técnica é o elemento fixo de identidade; dentro dela, cada obra pode ter um estilo visual diferente (isso é proposital, reflete a mistura de estilos da artista).

PÁGINAS E FUNCIONALIDADES:
1. Página inicial: galeria em grid (3 colunas desktop, responsiva) com as obras. Cabeçalho com o nome "Ateliê da Ana", uma frase de efeito tipo "Escala 1:1 · Obras originais", e um parágrafo de apresentação (ela é arquiteta e artista).
2. Página de produto individual para cada obra: imagem grande (com marca d'água / baixa resolução, já que é antes da compra), título, técnica, ano, dimensões, descrição, preço, e um formulário simples pedindo o e-mail do comprador antes de ir pro checkout.
3. Checkout via Mercado Pago (Pix + cartão de crédito): ao clicar em comprar, criar uma "preference" no Mercado Pago e redirecionar o usuário pro checkout deles. Meta: usar Checkout Pro do Mercado Pago (eles hospedam a página de pagamento).
4. Webhook do Mercado Pago: endpoint de backend que recebe a confirmação de pagamento (server-to-server, nunca confiar só no retorno do navegador), verifica o status real do pagamento direto na API do Mercado Pago, e só então libera o download.
5. Download protegido: depois do pagamento confirmado, gerar um link de download temporário (expira em 1 hora, uso limitado a poucos downloads) para o arquivo original em alta resolução, e enviar esse link por e-mail para o comprador.
6. Imagens de preview grátis: as imagens exibidas antes da compra devem ter marca d'água (posso enviar depois um arquivo de assinatura/logo dela) e resolução reduzida. Bloquear clique direito e seleção de texto/imagem nessas áreas (proteção básica contra cópia casual, sabendo que não é 100% infalível).
7. Páginas de retorno do pagamento: sucesso, pendente e falha, com mensagens claras.
8. Um painel simples (pode ser bem básico) para cadastrar/editar obras (título, técnica, ano, dimensões, preço, imagens) sem precisar mexer em código.

Por enquanto pode usar 2-3 obras de exemplo com imagens placeholder (vou trocar pelas reais depois). Pode usar Supabase para banco de dados e storage das imagens. Para pagamentos, deixe os campos de configuração (chaves de API do Mercado Pago) claramente indicados para eu preencher depois — não precisa ter chaves reais funcionando agora, só a estrutura pronta.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://atelie-ana-art.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d8b66181-d075-43f4-b7cd-b9236f79f481).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
