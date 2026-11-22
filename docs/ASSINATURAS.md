# Assinaturas — Sentinelas da Estação

## Planos
| Plano | Valor | Cobrança |
|---|---|---|
| Gratuito | R$ 0 | — |
| Sentinelas Completo — mensal | R$ 19,90 | por mês, renovação automática mensal |
| Sentinelas Completo — anual | R$ 197,00 | por ano, cobrados de uma vez, renovação automática anual |

Os valores ficam na tabela `planos` (Supabase) e são configuráveis. Para mudar um preço: criar o novo preço no Stripe,
atualizar `provedor_preco_id` e `valor_centavos` na linha do plano. (Assinantes atuais continuam no preço antigo até migrarem no Stripe.)

## O que cada plano libera (somente recursos que já existem)
**Gratuito:** oração e Palavra do dia (Minha Torre), apresentação das quatro estações, consulta aos oito portais e lembretes,
jornada introdutória de sete dias, capítulos de abertura da Biblioteca (`CAPITULOS_GRATUITOS` em `src/lib/assinatura/planos.ts`).

**Sentinelas Completo:**
| Benefício pedido | Recurso no app |
|---|---|
| Biblioteca completa de orações / Orações por tema e alvo | Orações de batalha espiritual (8 temas × 6 alvos, breve/completa/guiada) — `/oracao/`, portais, altar |
| Planejamento pessoal de intercessão | Meu Altar (pedidos, recalibração, histórico, testemunhos) e vigílias registradas |
| Diário da sentinela | Diário (com anexos) |
| Estudos bíblicos e aplicações práticas | Biblioteca completa do livro (estações, portais, discernimento, diário) |
| — | Assistente de oração (local) e IA avançada, quando ativada |
| Jornadas de batalha espiritual | **Ainda não existe** — não é anunciado |
| Jornadas por estação espiritual | **Ainda não existe** — não é anunciado |
| Novos conteúdos | “Novos conteúdos conforme forem publicados” |

Não há atendimento pessoal, mentoria nem comunidade na oferta.

## Chave de lançamento
`app_config.assinaturas_ativas` (padrão **false**). Enquanto estiver desligada, todas as pessoas têm acesso completo,
exatamente como antes. Ligar no SQL Editor quando decidir lançar:
```sql
update public.app_config set valor = 'true'::jsonb where chave = 'assinaturas_ativas';
```
Cortesia (autora, revisoras):
```sql
insert into public.assinaturas (user_id, provedor, status, observacao) values ('<uuid>', 'cortesia', 'ativa', 'cortesia');
```

## Provedor: Stripe (escolha e motivo)
O app não tinha provedor. O Stripe foi escolhido porque oferece, prontos e em português: checkout hospedado (o app nunca vê o cartão),
portal do cliente (trocar cartão, ver faturas, cancelar), assinaturas mensais/anuais em BRL, webhooks assinados e modo de teste completo.
A integração fica isolada em `src/lib/assinatura/stripe.ts` e `eventos.ts`; outro provedor (ex.: Mercado Pago) pode ser
implementado nas mesmas funções. Observação: no Stripe, assinaturas recorrentes no Brasil são por cartão.

## Segurança e confiabilidade
- Chaves só no servidor (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`); teste automatizado garante.
- O acesso é decidido no banco (`tem_acesso_completo`): a volta do checkout **não** libera nada — a página consulta o provedor pelo servidor.
- Conteúdo pago (livro e orações) fica em `src/lib/conteudo-pago` e só sai por `/api/conteudo/*` após a verificação; a IA também verifica.
- Registros novos de altar, vigílias, diário e anexos exigem acesso (RLS); os antigos continuam legíveis, editáveis, exportáveis e apagáveis.
- Webhook: assinatura HMAC validada (tolerância 5 min), evento registrado (idempotência), estado **relido no Stripe** e gravado
  com proteção contra estado antigo (fora de ordem). Erro → 500 para o Stripe reenviar.
- Sem assinaturas duplicadas: checagem no banco e no Stripe antes do checkout, reaproveitamento do checkout aberto; se mesmo assim
  surgirem duas, ficam marcadas com “possível duplicidade” para revisão.
- Reconciliação: `POST /api/assinatura/sincronizar` (botão “Atualizar situação”) relê o provedor.

## Situações tratadas
| Stripe | App | Acesso |
|---|---|---|
| incomplete | pendente | não |
| active / trialing | ativa | sim |
| past_due (novas tentativas) | em_atraso | sim |
| cancel_at_period_end | ativa · renovação cancelada | até o fim do período |
| canceled | cancelada | não |
| incomplete_expired | expirada | não |
| unpaid | suspensa | não |
| reembolso total | encerra a assinatura (configurável) | não |
| contestação aberta | suspensa até a conclusão; perdida encerra | não |

## Configuração (quando decidir ativar)
1. Aplicar a migração `supabase/migrations/20261122000000_assinaturas.sql`.
2. Stripe (modo de teste): criar o produto “Sentinelas Completo” com dois preços recorrentes em BRL (mensal 19,90; anual 197,00).
   Gravar os `price_...` em `planos.provedor_preco_id`.
3. Stripe > Configurações > Portal do cliente: ativar troca de cartão, faturas e cancelamento **ao fim do período**.
4. Stripe > Webhooks: endpoint `https://<app>/api/assinatura/webhook` com os eventos
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`,
   `customer.subscription.created|updated|deleted|paused|resumed`, `invoice.paid`, `invoice.payment_failed`, `invoice.payment_action_required`,
   `charge.refunded`, `charge.dispute.created`, `charge.dispute.closed`.
5. Vercel > Environment Variables: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_URL`.
6. Testar com cartões de teste do Stripe; só depois trocar para as chaves de produção e ligar `assinaturas_ativas`.
