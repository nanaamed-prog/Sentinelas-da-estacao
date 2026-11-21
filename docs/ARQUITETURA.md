# Arquitetura — Sentinelas da Estação

## Stack
- **Next.js 15 (App Router) + React 19 + TypeScript**
- **Tailwind CSS 3** com tokens centralizados em `src/styles/globals.css` (variáveis CSS por tema) e `tailwind.config.ts`
- **Zod** para validar todo dado gravado (`src/lib/store/schema.ts`)
- Fontes **Playfair Display, Lora, Inter** via `@fontsource` (licença OFL, servidas pelo próprio app — sem chamadas externas)
- **PWA**: `public/manifest.webmanifest`, `public/sw.js`, ícones em `public/icons/`
- Testes: **Vitest** (`tests/`) + fluxo ponta a ponta verificado em navegador headless
- Fase 2: **Supabase** (Auth, PostgreSQL com RLS, Storage privado). Fase 5: rotas `src/app/api/*` server-side para IA.

> shadcn/ui: os componentes base foram escritos à mão (dialog nativo acessível, estados, campos)
> para manter o bundle leve. Componentes shadcn podem ser adicionados sem conflito.
> React Hook Form e TanStack Query entram na Fase 2, quando houver formulários remotos e cache de servidor.

## Camada de dados
`Store` (`src/lib/store/store.ts`) expõe a API de domínio (estações, vigílias, pedidos, recalibração, diário,
exportar, apagar). Hoje usa o adaptador `browserStorage` (localStorage, só no aparelho).
Na Fase 2 o adaptador passa a ser o Supabase — as telas não mudam.

Regras já implementadas:
- trocar de estação **encerra** a anterior e preserva o histórico;
- só existe **uma vigília em andamento** por vez;
- **Recalibrar** nunca altera o pedido original — cria entrada nova no histórico;
- dados corrompidos não quebram o app (voltam ao estado vazio);
- nenhum pedido ou ID aparece em URL (detalhes abrem em painel).

## Temas
`noite` (padrão, inspirado na capa) e `pergaminho` (claro, para leitura prolongada).
Superfícies de leitura usam a classe `.leitura` (marfim + Lora) em qualquer tema.

## Princípios do método respeitados na interface
- Nenhuma pontuação de santidade; “Vigílias de hoje” é só um registro.
- A Torre muda a atmosfera conforme a estação, nunca representa “nível”.
- Portais não têm poder automático; o texto do onboarding diz isso.
- O app não diagnostica estação nem vontade de Deus — a escolha é da pessoa.

## Estrutura
```
src/app/            rotas: / (Minha Torre), boas-vindas, vigilias/[id], estacoes, altar, diario, configuracoes
src/components/     brand (Torre), layout (AppShell, BottomNavigation, SecondaryMenu), ui, seasons, portals, altar
src/lib/content/    portais, estações, referências do dia (conteúdo do método)
src/lib/store/      schema Zod, Store, provider React
public/             manifest, service worker, ícones
tests/              testes automatizados
supabase/           migrations (Fase 2)
```
