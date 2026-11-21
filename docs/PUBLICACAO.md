# Checklist de publicação

- [x] App em produção: https://sentinelas-da-estacao.vercel.app (deploy automático a cada push na `main`)
- [x] PWA instalável (manifest, ícones, atalhos, funcionamento offline das telas principais)
- [x] Acessibilidade: 0 violações (axe) nas 14 telas; Lighthouse acessibilidade 100
- [x] Desempenho (Lighthouse mobile): ~93
- [x] Testes automatizados (`npm test`)
- [ ] Supabase: Site URL / Redirect URLs com o domínio final
- [ ] Supabase: proteção contra senhas vazadas
- [ ] Domínio próprio (opcional): Vercel → Settings → Domains; depois atualizar o Supabase
- [ ] E-mail de privacidade na Política de Privacidade
- [ ] Revisão jurídica da Política de Privacidade (LGPD)
- [ ] E-mails do Supabase em português (*Authentication → Email Templates*); para volume, SMTP próprio
- [ ] Estratégia de backup (plano Pro ou backup próprio — ver SEGURANCA.md)
- [ ] IA avançada (opcional): `AI_API_KEY` na Vercel
