# Sentinelas da Estação

**Desperte. Vigie. Ore. Permaneça.** — aplicativo devocional do método de **Naiara de Medeiros**.

PWA instalável, mobile-first, em português brasileiro.

## Status
| Fase | Conteúdo | Situação |
|---|---|---|
| 1 — Fundação | design system, PWA, navegação, componentes, onboarding, Minha Torre | ✅ concluída |
| 1+ (local) | Estações, Vigílias, Meu Altar (com Recalibrar), Diário, exportar/apagar dados — salvos **no aparelho** | ✅ funcional |
| 2 — Contas e dados | Supabase: 19 tabelas com RLS, login, recuperação de senha, sincronização com fila offline, exclusão de conta, política de privacidade | ✅ código pronto · falta publicar |
| 3 — Núcleo | lembretes, anexos, testemunhos dedicados | — |
| 4 — Jornada e biblioteca | plano de 7 dias, leitor, calendário | — |
| 5 — Assistente | modelos locais, consentimento, API opcional (server-side) | — |
| 6 — Finalização | auditoria de segurança, performance, publicação | — |

## Rodar
```bash
npm install
npm run dev        # http://localhost:3000
npm test           # testes automatizados (vitest)
npm run typecheck
npm run build      # build de produção (Vercel)
node preview/build.mjs           # prévia de página única (modo local, sem conta)
```

## Publicar na Vercel
1. Suba a pasta para um repositório no GitHub.
2. Na Vercel: *Add New → Project* → importe o repositório (framework: Next.js, sem configurações extras).
3. Abra o endereço no celular → menu do navegador → **Adicionar à tela inicial**.

## Variáveis de ambiente
Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (chave publicável). Sem elas, o app roda em modo local.
Chaves de serviço e de IA ficam **somente no servidor** (nunca com prefixo `NEXT_PUBLIC_`).

## Conteúdo da autora
Textos devocionais, referências e orações de cada portal ficam em `src/lib/content/portals.ts`
(campos `explicacao`, `referencias`, `oracaoOrientativa`). Enquanto vazios, o app mostra
“Conteúdo da autora a ser inserido”. Nenhum texto bíblico de tradução protegida é reproduzido —
apenas referências.

Mais detalhes em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).

## Supabase
- Migrations em `supabase/migrations/` (aplicadas no projeto `ylcaiqszgprpjpvrzmdr`).
- Após publicar, em *Authentication → URL Configuration*: **Site URL** = endereço do app e, em **Redirect URLs**, `https://SEU-DOMINIO/**`.
- Exclusão de conta usa a função `excluir_minha_conta()` (a usuária só apaga a própria conta; tudo cai em cascata).
