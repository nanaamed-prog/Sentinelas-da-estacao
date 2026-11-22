import { build } from 'esbuild';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const r = (p) => path.join(root, p);
mkdirSync(r('preview/dist'), { recursive: true });

// CSS (Tailwind) sem as fontes locais: a prévia usa Google Fonts
writeFileSync(r('preview/dist/in.css'), readFileSync(r('src/styles/globals.css'), 'utf8'));
execSync(`npx tailwindcss -c tailwind.config.ts -i preview/dist/in.css -o preview/dist/app.css --minify`, { cwd: root, stdio: 'inherit' });

const res = await build({
  entryPoints: [r('preview/entry.tsx')], bundle: true, minify: true, write: false, format: 'iife', target: 'es2020',
  jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"', 'process.env.NEXT_PUBLIC_SUPABASE_URL': 'undefined', 'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': 'undefined' },
  alias: { '@/lib/assinatura/buscar': r('preview/shims/buscar.ts'), 'next/link': r('preview/shims/link.tsx'), 'next/navigation': r('preview/shims/navigation.ts'), '@': r('src') },
  loader: { '.css': 'empty' },
});
const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = readFileSync(r('preview/dist/app.css'), 'utf8');
const icon = readFileSync(r('public/icons/icon-192.png')).toString('base64');
const html = `<!DOCTYPE html>
<html lang="pt-BR" data-theme="noite"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#111C29">
<title>Sentinelas da Estação — Fase 1</title>
<link rel="icon" href="data:image/png;base64,${icon}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Lora:ital@0;1&family=Playfair+Display:wght@400;600&display=swap" rel="stylesheet">
<style>${css}</style></head>
<body><div id="app"></div><script>${js}</script></body></html>`;
writeFileSync(r('preview/dist/index.html'), html);
console.log('ok', (html.length / 1024).toFixed(0) + ' KB');
