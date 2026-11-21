"""Gera arquivos pequenos derivados do e-book, para cada tela baixar só o que usa."""
import json, os
base = os.path.join(os.path.dirname(__file__), '..', 'src', 'lib', 'content')
livro = json.load(open(os.path.join(base, 'ebook.json')))
caps = {c['slug']: c for c in livro['capitulos']}
portais = {}
for s in caps['as-oito-vigilias']['secoes']:
    portais[s['titulo'].split(' — ', 1)[1]] = {'explicacao': ' '.join(s['paragrafos']), 'referencias': s['leituras'], 'perguntas': s.get('campos') or []}
estacoes = {}
for c in livro['capitulos']:
    if c.get('estacao'):
        o = next(s for s in c['secoes'] if s['titulo'].startswith('Oração d'))
        estacoes[c['estacao']] = {'slug': c['slug'], 'capitulo': c['titulo'], 'oracao': {k: o[k] for k in ('titulo', 'subtitulo', 'reflexao', 'leituras')}}
indice = [{k: c.get(k) for k in ('slug', 'numero', 'titulo', 'epigrafe', 'estacao')} | {'partes': len(c['secoes'])} for c in livro['capitulos']]
json.dump(portais, open(os.path.join(base, 'portais-conteudo.json'), 'w'), ensure_ascii=False, indent=1)
json.dump(estacoes, open(os.path.join(base, 'estacoes-conteudo.json'), 'w'), ensure_ascii=False, indent=1)
json.dump({'titulo': livro['titulo'], 'subtitulo': livro['subtitulo'], 'autora': livro['autora'], 'edicao': livro['edicao'], 'capitulos': indice},
          open(os.path.join(base, 'ebook-indice.json'), 'w'), ensure_ascii=False, indent=1)
print('derivados ok:', len(portais), 'portais,', len(estacoes), 'estações,', len(indice), 'capítulos')
