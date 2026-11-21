"""Converte o HTML em PDF (Chrome), descobre as páginas de cada capítulo para o sumário e junta capa + miolo."""
import asyncio, json, re, sys
from playwright.async_api import async_playwright
from pypdf import PdfReader, PdfWriter

saida, etapa = sys.argv[1], sys.argv[2]
RODAPE = ('<div style="width:100%;font-family:Inter,sans-serif;font-size:6.5pt;letter-spacing:.18em;color:#A8732F;'
          'text-align:center;padding-bottom:6mm"><span style="text-transform:uppercase">Sentinelas da Estação</span>'
          ' &nbsp;·&nbsp; <span class="pageNumber"></span></div>')

async def pdf(html, out, rodape):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = await b.new_page()
        await pg.goto(f'file://{saida}/{html}', wait_until='networkidle')
        await pg.evaluate('document.fonts.ready')
        await pg.pdf(path=out, prefer_css_page_size=True, print_background=True,
                     display_header_footer=rodape, header_template='<span></span>', footer_template=RODAPE if rodape else '<span></span>')
        await b.close()

async def main():
    await pdf('miolo.html', f'{saida}/miolo.pdf', True)
    if etapa == 'passo1':
        r = PdfReader(f'{saida}/miolo.pdf'); paginas = {}
        for i, pg in enumerate(r.pages):
            for m in re.findall(r'§([a-z0-9-]+)§', pg.extract_text() or ''):
                paginas.setdefault(m, i + 1)
        json.dump(paginas, open(f'{saida}/paginas.json', 'w'))
        print('capítulos localizados:', len(paginas))
        return
    await pdf('capa.html', f'{saida}/capa.pdf', False)
    await pdf('miolo.html', f'{saida}/miolo-sem-rodape.pdf', False)
    await pdf('contracapa.html', f'{saida}/contracapa.pdf', False)
    w = PdfWriter()
    w.add_page(PdfReader(f'{saida}/capa.pdf').pages[0])
    com, sem = PdfReader(f'{saida}/miolo.pdf'), PdfReader(f'{saida}/miolo-sem-rodape.pdf')
    for i, pg in enumerate(com.pages):
        # páginas escuras de página cheia ficam sem número
        w.add_page(sem.pages[i] if '§cheia§' in (pg.extract_text() or '') else pg)
    w.add_page(PdfReader(f'{saida}/contracapa.pdf').pages[0])
    w.add_metadata({'/Title': 'Sentinelas da Estação', '/Author': 'Naiara de Medeiros', '/Subject': 'Uma jornada de Palavra, oração e discernimento'})
    with open(f'{saida}/Sentinelas-da-Estacao-Naiara-de-Medeiros.pdf', 'wb') as fh: w.write(fh)
    print('páginas:', len(w.pages))

asyncio.run(main())
