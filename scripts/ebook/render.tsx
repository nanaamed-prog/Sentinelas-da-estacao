import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, writeFileSync } from 'node:fs';
import { Capa, Contracapa, Miolo, Documento } from './Livro';

const [, , saida, fontes, paginasJson] = process.argv;
const css = readFileSync(new URL('./livro.css', `file://${process.env.EBOOK_DIR}/`), 'utf8').replaceAll('FONTES', `file://${fontes}`);
const paginas = paginasJson ? JSON.parse(readFileSync(paginasJson, 'utf8')) : {};
const html = (n: React.ReactNode) => '<!DOCTYPE html>' + renderToStaticMarkup(<Documento css={css}>{n}</Documento>);
writeFileSync(`${saida}/capa.html`, html(<Capa />));
writeFileSync(`${saida}/contracapa.html`, html(<Contracapa />));
writeFileSync(`${saida}/miolo.html`, html(<Miolo paginas={paginas} />));
console.log('html ok');
