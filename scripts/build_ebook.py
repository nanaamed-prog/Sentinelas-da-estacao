import re, json, subprocess
exec(open('/home/claude/scripts/parse_ebook.py').read().split("secoes = []")[0])  # reaproveita helpers

def frases_caps(s):
    partes = re.split(r'(?<=[.!?])\s+', s.strip())
    return ' '.join(p[:1].upper() + p[1:].lower() for p in partes)

def titulo_ok(t):
    return re.sub(r'\b([A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2,}(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2,})*)\b', lambda m: m.group(1).lower(), t)

REF2 = r'(?:\d\s)?[A-ZÁÉÍÓÚÊ][a-záéíóúâêôãõç]+(?:\s[a-záéíóú]+)?\s\d+(?::\d+(?:-\d+)?)?'
raw = json.load(open('/tmp/ebook_raw.json'))
txt = open('/tmp/torre.txt').read()

def secao(i):
    x = dict(raw[i])
    # rótulos "DIA 1 — PALAVRA E ESTAÇÃO" preservados antes da limpeza de caixa alta
    return x

# reprocessa corpos com os rótulos de dia preservados
def corpo_dias(pagina_inicio, pagina_fim):
    bloco = txt[txt.index(pagina_inicio):txt.index(pagina_fim)]
    bloco = bloco.split('\n', 2)[-1]
    bloco = bloco[:bloco.index('PARA LER NA BÍBLIA')]
    bloco = re.sub(r'DIA (\d) — ([A-ZÁÉÍÓÚÂÊÔÃÕÇ ]+?) (?=[A-Z][a-z])', lambda m: f'\n§Dia {m.group(1)} — {m.group(2).strip().capitalize()}§ ', bloco)
    linhas = [l.strip() for l in bloco.split('\n') if l.strip()]
    out, atual = [], ''
    for l in linhas:
        if l.startswith('§'):
            if atual: out.append(atual.strip())
            atual = l
        elif atual: atual += ' ' + l
    if atual: out.append(atual.strip())
    return [re.sub(r'§(.+?)§', r'**\1.**', o) for o in out]

def campos(refl):
    # "Minha estação: Evidências concretas: ..." → lista de campos para preencher
    partes = [p.strip() for p in re.split(r'(?<=[:?])\s+', refl) if p.strip()]
    if len(partes) >= 2 and all(p.endswith((':', '?')) for p in partes):
        return [p.rstrip(':') for p in partes]
    return None

limpa_fim = lambda s: re.sub(r'\s+[A-ZÁÉÍÓÚ]$', '', s.strip())

def montar(i, **fix):
    x = raw[i]
    s = {
        'titulo': titulo_ok(x['titulo']).replace('Quatro perguntas de discernimento', 'Quatro perguntas de discernimento'),
        'subtitulo': frases_caps(x['subtitulo']) if x['subtitulo'] else '',
        'paragrafos': x['paragrafos'],
        'leituras': x['leituras'],
        'destaque': x['destaque'],
        'reflexao': limpa_fim(x['reflexao']),
    }
    # leituras com livros iniciados por Ê (ex.: Êxodo) que o 1º passe não reconheceu
    linha_refs = None
    s.update(fix)
    c = campos(s['reflexao'])
    if c: s['campos'] = c; s['reflexao'] = ''
    return s

CAPS_LEAD = lambda i, extra='': [frases_caps(raw[i]['subtitulo'] + (' ' + extra if extra else '')) + (' ' + raw[i]['paragrafos'][0] if raw[i]['paragrafos'] else '')] + raw[i]['paragrafos'][1:]

caps = [
 dict(slug='a-jornada-da-sentinela', numero=None, titulo='A Jornada da Sentinela', epigrafe='Uma nova jornada', secoes=[
   {'titulo': 'Uma nova jornada', 'subtitulo': '', 'paragrafos': [
      'Esta edição foi redesenhada para ser lida como uma caminhada, não como uma coleção de páginas isoladas. Cada capítulo apresenta uma verdade bíblica, uma reflexão, uma oração e uma prática de registro.',
      'A imagem das estações é uma metáfora devocional. Primavera, verão, outono e inverno não determinam o que Deus fará. Os portais são horários de atenção e oração; não são fontes de revelação nem condições para que Deus ouça.'],
    'leituras': [], 'destaque': 'Palavra • Oração • Discernimento • Fidelidade • Propósito', 'reflexao': 'Desperte. Vigie. Ore. Permaneça.'}]),
 dict(slug='o-deus-das-estacoes', numero=1, titulo='O Deus das Estações', epigrafe='O tempo pertence ao Senhor', secoes=[montar(3), montar(4)]),
 dict(slug='o-chamado-da-sentinela', numero=2, titulo='O Chamado da Sentinela', epigrafe='Vigiar com sobriedade', secoes=[
   montar(6), montar(7), montar(8), montar(9, subtitulo='', paragrafos=CAPS_LEAD(9))]),
 dict(slug='discernindo-sua-estacao', numero=3, titulo='Discernindo sua Estação', epigrafe='Aprender a discernir', secoes=[
   montar(11), montar(12, titulo='Quatro perguntas de discernimento', subtitulo='Observe antes de concluir'), montar(13), montar(14), montar(15)]),
 dict(slug='primavera', numero=4, titulo='Primavera — Plante', epigrafe='A coragem dos começos', estacao='primavera', secoes=[
   montar(17, paragrafos=[frases_caps('Primavera fala de começos. Nem todo começo chega acompanhado') + raw[17]['paragrafos'][0].split('acompanhado', 1)[1]] + raw[17]['paragrafos'][1:]),
   montar(18), montar(19), montar(20), montar(21), montar(22, subtitulo='Use esta oração como ponto de partida e adapte com suas próprias palavras.')]),
 dict(slug='verao', numero=5, titulo='Verão — Frutifique', epigrafe='Maturidade para frutificar', estacao='verao', secoes=[
   montar(24, paragrafos=[frases_caps('Verão representa crescimento, movimento e fruto. É a estação em') + ' ' + raw[24]['paragrafos'][0]] + raw[24]['paragrafos'][1:]),
   montar(25, leituras=['1 Coríntios 14:40', 'Êxodo 18:17-23']), montar(26), montar(27), montar(28),
   montar(29, subtitulo='Ore entregando a Deus tanto os resultados quanto a maneira de administrá-los.')]),
 dict(slug='outono', numero=6, titulo='Outono — Deixe Deus Podar', epigrafe='A sabedoria de entregar', estacao='outono', secoes=[
   montar(31), montar(32), montar(33), montar(34), montar(35), montar(36)]),
 dict(slug='inverno', numero=7, titulo='Inverno — Permaneça', epigrafe='Fidelidade na espera', estacao='inverno', secoes=[
   montar(38, subtitulo='', paragrafos=['Inverno representa tempos em que pouco parece acontecer na superfície. ' + raw[38]['paragrafos'][0]] + raw[38]['paragrafos'][1:]),
   montar(39), montar(40), montar(41), montar(42), montar(43)]),
 dict(slug='as-oito-vigilias', numero=8, titulo='Os Oito Portais', epigrafe='Oito pausas para orar', secoes=[montar(i) for i in range(45, 53)]),
 dict(slug='meu-altar', numero=None, titulo='Meu Altar de Intercessão', epigrafe='Pedidos que permanecem', secoes=[montar(i) for i in range(53, 57)]),
 dict(slug='diario-da-sentinela', numero=None, titulo='Diário da Sentinela', epigrafe='Ler, compreender, responder', secoes=[montar(i) for i in range(57, 61)]),
 dict(slug='plano-de-sete-dias', numero=None, titulo='Plano de 7 Dias', epigrafe='Comece pelo essencial', secoes=[
   montar(61, paragrafos=corpo_dias('Dias 1 e 2\nCOMECE', 'Dias 3, 4 e 5')),
   montar(62, paragrafos=corpo_dias('Dias 3, 4 e 5\nVIGILÂNCIA', 'Dias 6 e 7')),
   montar(63, paragrafos=corpo_dias('Dias 6 e 7\nPERMANEÇA', 'ENCERRAMENTO\n\nA comissão'))]),
 dict(slug='encerramento', numero=None, titulo='Encerramento', epigrafe='A comissão da sentinela', secoes=[
   montar(64, reflexao='Desperte. Vigie. Ore. Permaneça.'),
   montar(65, subtitulo='Termine esta jornada apresentando novamente sua vida ao Senhor.'),
   {'titulo': 'Reflexão e oração', 'subtitulo': '', 'paragrafos': ['Não é preciso conhecer todos os caminhos para caminhar com fidelidade hoje. Volte à Palavra. Ore com sinceridade. Examine tudo. Permaneça em Cristo.'], 'leituras': [], 'destaque': '', 'reflexao': ''}]),
]
livro = {'titulo': 'Sentinelas da Estação', 'autora': 'Naiara de Medeiros', 'edicao': 'Edição Torre de Vigília', 'capitulos': caps}
json.dump(livro, open('/home/claude/sentinelas-da-estacao/src/lib/content/ebook.json', 'w'), ensure_ascii=False, indent=1)
print(sum(len(c['secoes']) for c in caps), 'seções em', len(caps), 'capítulos')

# ---- ajustes finais ----
TITULOS_EST = {'Primavera — plante': 'Primavera — Plante', 'Verão — frutifique': 'Verão — Frutifique',
               'Outono — deixe deus podar': 'Outono — Deixe Deus Podar', 'Inverno — permaneça': 'Inverno — Permaneça'}
def nomes(t): return re.sub(r'\b(deus|cristo|jesus|espírito santo|senhor)\b', lambda m: m.group(1).title(), t)
def maiuscula_apos_ponto(t): return re.sub(r'([.!?] )([a-záéíóúâêôãõç])', lambda m: m.group(1) + m.group(2).upper(), t)
for c in livro['capitulos']:
    for s in c['secoes']:
        s['titulo'] = TITULOS_EST.get(s['titulo'], s['titulo'])
        s['subtitulo'] = nomes(s['subtitulo'])
        s['paragrafos'] = [maiuscula_apos_ponto(p) for p in s['paragrafos'] if p.strip()]
        if s['titulo'] == 'Quatro perguntas de discernimento':
            s['campos'] = ['Fatos: o que aconteceu de verdade?', 'Interpretação: o que você concluiu?', 'Palavra: o que é claro biblicamente?']
json.dump(livro, open('/home/claude/sentinelas-da-estacao/src/lib/content/ebook.json', 'w'), ensure_ascii=False, indent=1)
print('ok ajustes')
