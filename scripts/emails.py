"""Modelos de e-mail do Supabase Auth em português, na identidade do app."""
import html, json, os
SAIDA = os.path.join(os.path.dirname(__file__), '..', 'supabase', 'templates')

def modelo(titulo, paragrafos, botao, aviso):
    ps = ''.join(f'<p style="margin:0 0 16px;font-family:Georgia,\'Times New Roman\',serif;font-size:16px;line-height:1.6;color:#302820">{p}</p>' for p in paragrafos)
    return f'''<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{titulo}</title></head>
<body style="margin:0;padding:0;background:#F2E7D6">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2E7D6;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFF9EF;border-radius:14px;overflow:hidden;border:1px solid #E6D2B0">
<tr><td style="background:#111C29;padding:28px 24px;text-align:center">
<p style="margin:0;font-family:Georgia,serif;font-size:13px;letter-spacing:4px;color:#E2B97F">&#10022;</p>
<p style="margin:6px 0 0;font-family:Georgia,serif;font-size:24px;letter-spacing:5px;color:#C58B42">SENTINELAS</p>
<p style="margin:4px 0 0;font-family:Georgia,serif;font-size:12px;letter-spacing:6px;color:#E2B97F">DA ESTAÇÃO</p>
</td></tr>
<tr><td style="padding:32px 28px 8px">
<h1 style="margin:0 0 18px;font-family:Georgia,serif;font-weight:normal;font-size:24px;line-height:1.3;color:#111C29">{titulo}</h1>
{ps}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="background:#C58B42;border-radius:999px">
<a href="{{{{ .ConfirmationURL }}}}" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#111C29;text-decoration:none">{botao}</a>
</td></tr></table>
<p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6E6050">Se o botão não funcionar, copie este endereço no navegador:</p>
<p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:12px;word-break:break-all"><a href="{{{{ .ConfirmationURL }}}}" style="color:#8C5C22">{{{{ .ConfirmationURL }}}}</a></p>
<p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#6E6050">{aviso}</p>
</td></tr>
<tr><td style="padding:18px 28px 26px;border-top:1px solid #E6D2B0;text-align:center">
<p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:14px;color:#632B2A">Desperte. Vigie. Ore. Permaneça.</p>
<p style="margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#6E6050">Sentinelas da Estação · Naiara de Medeiros</p>
</td></tr></table>
</td></tr></table></body></html>'''

MODELOS = [
  {'id': 'confirmar-cadastro', 'onde': 'Confirm sign up', 'assunto': 'Confirme seu e-mail · Sentinelas da Estação',
   'html': modelo('Bem-vinda à torre', ['Que alegria ter você aqui. Falta só um passo para começar sua jornada de Palavra, oração e discernimento.',
                  'Toque no botão abaixo para confirmar seu e-mail:'], 'Confirmar meu e-mail',
                  'Se você não criou uma conta no Sentinelas da Estação, pode ignorar este e-mail com tranquilidade.')},
  {'id': 'redefinir-senha', 'onde': 'Reset password', 'assunto': 'Crie uma nova senha · Sentinelas da Estação',
   'html': modelo('Vamos criar uma nova senha', ['Recebemos um pedido para redefinir a senha da sua conta.',
                  'Toque no botão abaixo para escolher uma nova senha. O link vale por pouco tempo e só pode ser usado uma vez.'], 'Criar nova senha',
                  'Se você não pediu para trocar a senha, ignore este e-mail: sua senha continua a mesma e sua conta segue protegida.')},
  {'id': 'alterar-email', 'onde': 'Change email address', 'assunto': 'Confirme seu novo e-mail · Sentinelas da Estação',
   'html': modelo('Confirme seu novo e-mail', ['Recebemos um pedido para trocar o e-mail da sua conta de <strong>{{ .Email }}</strong> para <strong>{{ .NewEmail }}</strong>.',
                  'Toque no botão abaixo para confirmar a mudança:'], 'Confirmar novo e-mail',
                  'Se você não pediu essa mudança, ignore este e-mail e considere trocar sua senha.')},
  {'id': 'link-de-acesso', 'onde': 'Magic link', 'assunto': 'Seu link de acesso · Sentinelas da Estação',
   'html': modelo('Seu link de acesso', ['Use o botão abaixo para entrar na sua conta. O link vale por pouco tempo e só pode ser usado uma vez.'], 'Entrar no app',
                  'Se você não pediu este link, ignore este e-mail.')},
]
for m in MODELOS:
    open(os.path.join(SAIDA, f"{m['id']}.html"), 'w').write(m['html'])
json.dump([{k: m[k] for k in ('id', 'onde', 'assunto')} for m in MODELOS], open(os.path.join(SAIDA, 'assuntos.json'), 'w'), ensure_ascii=False, indent=1)

# página de cópia (para colar no painel do Supabase pelo celular)
cards = ''
for i, m in enumerate(MODELOS):
    cards += f'''<section class="card"><p class="onde">No Supabase: <strong>{m['onde']}</strong></p>
<label>Assunto (Subject)</label><div class="linha"><input readonly id="a{i}" value="{html.escape(m['assunto'])}"><button data-alvo="a{i}">Copiar</button></div>
<label>Corpo (Message body)</label><div class="linha"><textarea readonly id="c{i}">{html.escape(m['html'])}</textarea><button data-alvo="c{i}">Copiar</button></div>
<details><summary>Ver como fica</summary><iframe title="Prévia {m['onde']}" sandbox srcdoc="{html.escape(m['html'].replace('{{ .ConfirmationURL }}', '#').replace('{{ .Email }}', 'voce@exemplo.com').replace('{{ .NewEmail }}', 'novo@exemplo.com'))}"></iframe></details></section>'''
pagina = f'''<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>E-mails em português — Sentinelas da Estação</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Playfair+Display&display=swap" rel="stylesheet">
<style>body{{margin:0;background:#0B131D;color:#FFF9EF;font-family:Inter,system-ui,sans-serif}}main{{max-width:620px;margin:0 auto;padding:28px 18px 60px}}
h1{{font-family:'Playfair Display',serif;font-weight:400;color:#C58B42;font-size:28px;margin:0 0 8px}}p.intro{{color:#C4B8A6;font-size:14px;line-height:1.6}}
ol{{color:#C4B8A6;font-size:14px;line-height:1.7;padding-left:20px}}.card{{background:#111C29;border:1px solid rgba(197,139,66,.3);border-radius:16px;padding:16px;margin:16px 0}}
.onde{{margin:0 0 10px;font-size:14px}}label{{display:block;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#E2B97F;margin:12px 0 6px}}
.linha{{display:flex;gap:8px;align-items:stretch}}input,textarea{{flex:1;min-width:0;background:#1A2A3C;color:#FFF9EF;border:1px solid rgba(197,139,66,.3);border-radius:10px;padding:10px;font:12px ui-monospace,monospace}}
textarea{{height:84px;resize:vertical}}button{{background:#C58B42;color:#111C29;border:0;border-radius:999px;padding:0 16px;font-weight:600;font-size:13px;min-height:44px;cursor:pointer}}
button.ok{{background:#E2B97F}}details{{margin-top:12px}}summary{{cursor:pointer;color:#E2B97F;font-size:13px;min-height:32px}}iframe{{width:100%;height:560px;border:0;border-radius:12px;background:#F2E7D6;margin-top:8px}}
.aviso{{background:rgba(99,43,42,.45);border-radius:12px;padding:12px 14px;font-size:13px;line-height:1.6}}</style></head>
<body><main><h1>E-mails em português</h1>
<p class="intro">Modelos para o Supabase Auth na identidade do Sentinelas da Estação.</p>
<p class="aviso">Só dá para colar estes modelos depois de ligar um envio próprio de e-mails (SMTP) no Supabase. Projetos gratuitos novos não podem editar os textos usando o envio padrão.</p>
<ol><li>Abra <strong>Supabase → Authentication → Emails → Templates</strong>.</li><li>Em cada modelo abaixo, copie o <strong>assunto</strong> e cole em <em>Subject</em>.</li><li>Copie o <strong>corpo</strong> e cole em <em>Message body</em>, substituindo tudo.</li><li>Toque em <strong>Save</strong>.</li></ol>
{cards}</main>
<script>document.querySelectorAll('button[data-alvo]').forEach(b=>b.addEventListener('click',async()=>{{const t=document.getElementById(b.dataset.alvo).value;try{{await navigator.clipboard.writeText(t);b.textContent='Copiado ✓';b.classList.add('ok');setTimeout(()=>{{b.textContent='Copiar';b.classList.remove('ok')}},1800)}}catch(e){{const el=document.getElementById(b.dataset.alvo);el.focus();el.select();b.textContent='Selecionado'}}}}));</script>
</body></html>'''
open('/home/claude/emails/index.html', 'w').write(pagina)
print('ok', len(MODELOS), 'modelos')
