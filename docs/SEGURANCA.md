# Segurança, privacidade e recuperação

## O que está implementado
- **Autenticação** Supabase (e-mail e senha, confirmação por e-mail, recuperação de senha).
- **Row Level Security** em todas as 19 tabelas: cada usuária só lê e grava os próprios registros. Testado com duas contas.
- **Integridade entre tabelas**: atualizações, anexos e mensagens só podem apontar para registros da mesma usuária.
- **Arquivos** (anexos do diário) em bucket privado, por pasta da usuária, com links temporários de 1 hora.
- **Nenhum pedido em URL pública**; o endereço de lembretes leva só portal e horário.
- **Cabeçalhos**: CSP restrita (só o app e o Supabase do projeto), HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- **IA**: só no servidor, com consentimento registrado, limite diário e histórico apagável. A chave nunca chega ao navegador. Logs sem texto pessoal.
- **Exclusão de conta**: apaga arquivos e todos os registros (cascata). **Exportação**: cópia completa (JSON) e diário em texto.
- **Service worker** guarda apenas telas e arquivos estáticos — nunca dados pessoais nem respostas da API.

## Ajustes no painel do Supabase (manuais)
1. *Authentication → URL Configuration*: Site URL e Redirect URLs com o endereço do app.
2. *Authentication → Providers → Email*: ativar **proteção contra senhas vazadas** (quando disponível no plano).
3. Antes do lançamento: considerar o **plano Pro** — backups diários (7 dias) e o projeto não pausa por inatividade.

## Backups (decisão pendente)
- **Plano gratuito**: o Supabase não oferece backups acessíveis e pausa projetos após 1 semana sem uso. A recomendação do próprio Supabase é exportar os dados regularmente (`supabase db dump`) e guardar fora.
- Opções:
  1. **Plano Pro**: backups diários automáticos, restauração pelo painel.
  2. **Backup próprio** (ex.: GitHub Actions semanal com `pg_dump` criptografado). Envolve copiar os dados de todas as usuárias para outro serviço — avaliar com cuidado antes de ativar.
- Cada usuária pode exportar os próprios dados em *Configurações*.

## Pendências conhecidas
- `next` usa internamente uma versão do PostCSS com alerta de segurança (afeta só a compilação, não o app em uso). Resolver ao migrar para Next 16.
