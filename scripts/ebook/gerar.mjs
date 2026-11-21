// Gera o e-book em PDF: node scripts/ebook/gerar.mjs <pasta-de-saida>
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
const raiz = path.resolve(import.meta.dirname, '../..');
const dir = import.meta.dirname;
const saida = path.resolve(process.argv[2] ?? path.join(raiz, 'out-ebook'));
mkdirSync(saida, { recursive: true });
await build({
  entryPoints: [path.join(dir, 'render.tsx')], bundle: true, platform: 'node', format: 'esm', outfile: path.join(saida, 'render.mjs'),
  jsx: 'automatic', alias: { '@': path.join(raiz, 'src') }, loader: { '.json': 'json' }, logLevel: 'error',
  banner: { js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);" },
});
const fontes = path.join(raiz, 'node_modules/@fontsource');
const run = (extra = []) => execFileSync('node', [path.join(saida, 'render.mjs'), saida, fontes, ...extra], { stdio: 'inherit', env: { ...process.env, EBOOK_DIR: dir } });
run();
execFileSync('python3', [path.join(dir, 'pdf.py'), saida, 'passo1'], { stdio: 'inherit' });
run([path.join(saida, 'paginas.json')]);
execFileSync('python3', [path.join(dir, 'pdf.py'), saida, 'final'], { stdio: 'inherit' });
