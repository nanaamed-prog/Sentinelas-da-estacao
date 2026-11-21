import { Fragment, type ReactNode } from 'react';
import { CAPITULOS, LIVRO, type Capitulo, type Secao } from '@/lib/content/ebook';
import { SeasonArt } from '@/components/seasons/SeasonArt';
import { TowerMark } from '@/components/brand/Watchtower';
import { CapaArte } from './Capa';

/** Perguntas que se repetiam em todos os portais: aparecem uma vez só, na abertura do capítulo. */
const PERGUNTAS_PORTAIS = ['Pelo que vou agradecer?', 'Que pedido permanece no altar?', 'Qual atitude prática acompanha esta oração?'];
const LEMA = 'Cada estação tem um propósito. Deus permanece fiel em todas elas.';

const marcador = (id: string) => <span className="marcador">§{id}§</span>;
const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function Rico({ t }: { t: string }) {
  return <>{t.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <Fragment key={i}>{p}</Fragment>))}</>;
}

export function Capa() {
  return (
    <section className="capa">
      <CapaArte />
      <div className="capa-texto">
        <p className="capa-lema">Desperte · Vigie · Ore · Permaneça</p>
        <h1 className="capa-titulo">Sentinelas</h1>
        <p className="capa-da">— da Estação —</p>
        <div className="capa-fio" />
        <p className="capa-sub">{LIVRO.subtitulo}</p>
      </div>
      <p className="capa-autora">Naiara de Medeiros</p>
    </section>
  );
}

function Abertura({ c }: { c: Capitulo }) {
  return (
    <section className="abertura">
      {marcador('cheia')}
      {c.estacao && <div className="abertura-arte"><SeasonArt id={c.estacao} /></div>}
      <div className="abertura-texto">
        {marcador(c.slug)}
        <TowerMark className="abertura-torre" />
        {c.numero && <p className="abertura-num">Capítulo {String(c.numero).padStart(2, '0')}</p>}
        <h1 className="abertura-titulo">{c.titulo}</h1>
        <p className="abertura-epigrafe">{c.epigrafe}</p>
      </div>
    </section>
  );
}

function Linhas({ n = 3 }: { n?: number }) {
  return <div className="linhas">{Array.from({ length: n }, (_, i) => <span key={i} />)}</div>;
}

function SecaoView({ s, cap, portal }: { s: Secao; cap: Capitulo; portal?: boolean }) {
  // não repete o título quando ele é o próprio nome do capítulo
  const repete = norm(s.titulo) === norm(cap.titulo) || norm(cap.titulo).startsWith(norm(s.titulo));
  const campos = portal ? undefined : s.campos;
  return (
    <article className={portal ? 'secao portal' : 'secao'}>
      {!repete && <h2>{portal ? <><span className="portal-hora">{s.titulo.split(' — ')[0]}</span>{s.titulo.split(' — ')[1]}</> : s.titulo}</h2>}
      {s.subtitulo && <p className="sub">{s.subtitulo}</p>}
      {s.paragrafos.map((p, i) => <p key={i} className={i === 0 && !portal && !p.startsWith('**') ? 'abre' : undefined}><Rico t={p} /></p>)}
      {s.destaque && <blockquote>{s.destaque}</blockquote>}
      {s.leituras.length > 0 && (
        <p className="leituras"><span>Para ler na Bíblia</span>{s.leituras.join('  •  ')}</p>
      )}
      {!portal && (s.reflexao || campos) && (
        <div className="reflexao">
          <p className="rotulo">Reflexão / Oração</p>
          {s.reflexao && <p className="texto">{s.reflexao}</p>}
          {campos?.map((q) => <div key={q} className="campo"><p>{q}</p><Linhas n={campos.length > 2 ? 2 : 3} /></div>)}
        </div>
      )}
    </article>
  );
}

function Capitulo({ c }: { c: Capitulo }) {
  const portais = c.slug === 'as-oito-vigilias';
  return (
    <>
      {c.slug !== 'a-jornada-da-sentinela' && <Abertura c={c} />}
      <div className="corpo">
        {portais && (
          <div className="nota-portais">
            <p className="rotulo">Em cada portal, ore e registre</p>
            <ul>{PERGUNTAS_PORTAIS.map((q) => <li key={q}>{q}</li>)}</ul>
          </div>
        )}
        {c.secoes.map((s, i) => <SecaoView key={i} s={s} cap={c} portal={portais} />)}
      </div>
    </>
  );
}

export function Miolo({ paginas }: { paginas: Record<string, number> }) {
  const intro = CAPITULOS[0];
  const resto = CAPITULOS.slice(1);
  return (
    <>
      {/* folha de rosto */}
      <section className="rosto">
        {marcador('cheia')}
        <TowerMark className="rosto-torre" />
        <h1>Sentinelas da Estação</h1>
        <p className="rosto-sub">{LIVRO.subtitulo}</p>
        <p className="rosto-autora">Naiara de Medeiros</p>
        <p className="rosto-copy">© {new Date().getFullYear()} Naiara de Medeiros. Todos os direitos reservados.<br />As referências bíblicas indicam os textos para leitura na sua Bíblia.</p>
      </section>

      {/* abertura do livro (texto da autora) */}
      <section className="intro">
        {marcador('a-jornada-da-sentinela')}
        <p className="eyebrow">{intro.titulo}</p>
        <h1>{intro.secoes[0].titulo}</h1>
        {intro.secoes[0].paragrafos.map((p, i) => <p key={i}>{p}</p>)}
        <p className="intro-pilares">{intro.secoes[0].destaque}</p>
        <p className="intro-lema">{LEMA}</p>
      </section>

      {/* sumário */}
      <section className="sumario">
        <p className="eyebrow">O caminho do livro</p>
        <h1>Sumário</h1>
        <ol>
          {resto.map((c) => (
            <li key={c.slug}>
              <span className="n">{c.numero ? String(c.numero).padStart(2, '0') : ''}</span>
              <span className="t">{c.titulo}<em>{c.epigrafe}</em></span>
              <span className="p">{paginas[c.slug] ?? '00'}</span>
            </li>
          ))}
        </ol>
      </section>

      {resto.map((c) => <Capitulo key={c.slug} c={c} />)}

    </>
  );
}

export function Contracapa() {
  return (
    <section className="contracapa">
      <TowerMark className="contra-torre" />
      <p className="contra-lema">Desperte. Vigie. Ore. Permaneça.</p>
      <p className="contra-texto">Uma jornada de Palavra, oração, discernimento, fidelidade e propósito — com as quatro estações como metáfora devocional, oito portais de oração e práticas de registro para caminhar com Deus em cada tempo.</p>
      <p className="contra-autora">Naiara de Medeiros</p>
    </section>
  );
}

export function Documento({ children, css }: { children: ReactNode; css: string }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <title>Sentinelas da Estação — Naiara de Medeiros</title>
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
