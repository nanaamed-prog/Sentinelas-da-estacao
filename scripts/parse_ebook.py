import re, json, sys
txt = open('/tmp/torre.txt').read()
pages = re.split(r'\n\s*SENTINELAS DA ESTAÇÃO(?: · NAIARA DE MEDEIROS)?\s*\n\s*\d+\s*\n', txt)

CAPS = re.compile(r'^[A-ZÁÉÍÓÚÂÊÔÃÕÇÀ0-9 ,.;:!?\-—–“”"/·•]+$')
REF = re.compile(r'^(?:\d\s)?[A-ZÁÉÍÓÚ][a-záéíóúâêôãõç]+(?:\s[a-záéíóú]+)?\s\d+(?::\d+(?:-\d+)?)?$')

def limpa_caps(s):
    # remove palavras decorativas em CAIXA ALTA no meio do texto (ex.: "CAIR", "FIEL", "PLANTAR")
    toks = s.split(' ')
    out = [t for t in toks if not (len(re.sub(r'[^A-Za-zÁ-ú]', '', t)) >= 2 and re.sub(r'[^A-Za-zÁ-ú]', '', t).isupper())]
    return re.sub(r'\s+', ' ', ' '.join(out)).strip()

def sentenca(s):  # caixa alta → frase
    s = s.strip().lower()
    return s[:1].upper() + s[1:]

def juntar(linhas):
    """Une linhas quebradas pela diagramação em parágrafos (cada frase terminada vira quebra)."""
    texto = ' '.join(l.strip() for l in linhas if l.strip())
    texto = re.sub(r'\s+', ' ', texto)
    frases = re.split(r'(?<=[.!?”])\s+(?=[A-ZÁÉÍÓÚ“"])', texto)
    paras, atual = [], []
    for f in frases:
        atual.append(f)
        if len(' '.join(atual)) > 260: paras.append(' '.join(atual)); atual = []
    if atual: paras.append(' '.join(atual))
    return paras

secoes = []
for pg in pages:
    ls = [l.rstrip() for l in pg.split('\n')]
    while ls and not ls[0].strip(): ls.pop(0)
    if not ls: continue
    if 'PARA LER NA BÍBLIA' not in pg:
        secoes.append({'_cru': '\n'.join(ls)}); continue
    i = 0
    rotulo = None
    if re.match(r'^(CAPÍTULO \d+|MEU ALTAR|DIÁRIO DA SENTINELA|PLANO DE 7 DIAS|ENCERRAMENTO)$', ls[0].strip()):
        rotulo = ls[0].strip(); i = 1
        while not ls[i].strip(): i += 1
    titulo = ls[i].strip(); i += 1
    # título em 2 linhas (ex.: "Outono — DEIXE DEUS" / "PODAR")
    if i < len(ls) and ls[i].strip() and CAPS.match(ls[i].strip()) and len(ls[i].split()) <= 2:
        titulo += ' ' + ls[i].strip(); i += 1
    sub = ''
    corpo = []
    # subtítulo em caixa alta (pode continuar na linha seguinte)
    caps = []
    while i < len(ls) and ls[i].strip() and CAPS.match(ls[i].strip()):
        caps.append(ls[i].strip()); i += 1
    while i < len(ls) and not ls[i].strip(): i += 1
    j = ls.index('PARA LER NA BÍBLIA')
    resto = ls[i:j]
    if caps:
        cj = ' '.join(caps)
        if resto and resto[0][:1].islower():
            # é a frase de abertura em caixa alta
            corpo_ini = sentenca(cj)
            corpo = [corpo_ini + ' ' + resto[0].strip()] + resto[1:]
        else:
            sub = cj; corpo = resto
    else:
        corpo = resto
    k = j + 1
    while not ls[k].strip(): k += 1
    refline = ls[k].strip()
    partes = [p.strip() for p in refline.split('•')]
    refs, destaque = [], ''
    for idx, p in enumerate(partes):
        if REF.match(p): refs.append(p); continue
        m = re.match(r'^((?:\d\s)?[A-ZÁÉÍÓÚ][a-záéíóúâêôãõç]+(?:\s[a-záéíóú]+)?\s\d+(?::\d+(?:-\d+)?)?)\s+(.*)$', p)
        if m: refs.append(m.group(1)); destaque = m.group(2).strip()
    refl_ini = ls.index('REFLEXÃO / ORAÇÃO', k) + 1
    refl = [l for l in ls[refl_ini:] if l.strip()]
    corpo_txt = [limpa_caps(l) for l in corpo]
    refl_txt = limpa_caps(' '.join(refl))
    destaque = limpa_caps(destaque) if destaque.endswith(('.', '?', '!')) else ''
    secoes.append({'rotulo': rotulo, 'titulo': titulo, 'subtitulo': sub, 'paragrafos': juntar(corpo_txt),
                   'leituras': refs, 'destaque': destaque, 'reflexao': refl_txt})
json.dump(secoes, open('/tmp/ebook_raw.json', 'w'), ensure_ascii=False, indent=1)
print(len(secoes))
