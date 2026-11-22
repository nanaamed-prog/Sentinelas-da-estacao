import { describe, it, expect } from 'vitest';
import { PORTALS } from '@/lib/content/portals';
import { TEMA_DO_PORTAL, ALVO_DA_CATEGORIA, montarOracao as montar, type OpcoesOracao } from '@/lib/content/batalha';
import { ALVOS, ENCERRAMENTO, TEMAS, DADOS_ORACOES } from '@/lib/conteudo-pago/oracoes';
const montarOracao = (o: OpcoesOracao) => montar(o, DADOS_ORACOES);
import { CATEGORIAS } from '@/lib/store/schema';
import { SABOR_PORTAL } from '@/lib/content/prayers';

const todas = () => TEMAS.flatMap((t) => ALVOS.flatMap((a) => PORTALS.map((p) => montarOracao({ tema: t.id, alvo: a.id, portal: p.id }))));

describe('orações de batalha espiritual', () => {
  it('oito temas e seis alvos da intercessão', () => {
    expect(TEMAS.map((t) => t.nome)).toEqual([
      'Armadura de Deus', 'Resistência à tentação', 'Renúncia e arrependimento', 'Proteção da família e do lar',
      'Discernimento e vigilância', 'Libertação de hábitos pecaminosos', 'Perseverança em tempos difíceis', 'Paz e descanso após a intercessão',
    ]);
    expect(ALVOS.map((a) => a.nome)).toEqual(['Minha vida', 'Filhos e família', 'Lar', 'Relacionamentos', 'Trabalho e provisão', 'Igreja e comunidade']);
  });

  it('segue as sete etapas e termina em nome de Jesus', () => {
    const o = montarOracao({ tema: 'armadura', alvo: 'familia', portal: 'alvorada' });
    expect(o.etapas.map((e) => e.id)).toEqual(['adoracao', 'confissao', 'revestimento', 'resistencia', 'intercessao', 'protecao', 'entrega']);
    expect(o.etapas[0].texto).toContain('tribunal da graça');
    expect(o.etapas[1].texto).toMatch(/perdo/i);
    expect(o.etapas[2].texto).toMatch(/couraça da justiça/);
    expect(o.texto).toMatch(/Em nome de Jesus, amém\.$/);
    expect(o.atitude.length).toBeGreaterThan(20);
    expect(o.referencias).toContain('Efésios 6:10-18');
  });

  it('formato: título, tema, referências, oração, passo prático', () => {
    for (const o of todas()) {
      expect(o.titulo && o.tema && o.texto && o.atitude).toBeTruthy();
      expect(o.referencias.length).toBeGreaterThan(0);
      expect(o.texto.match(/amém\./g)?.length).toBe(1);
    }
  });

  it('varia por tema e por alvo', () => {
    const porTema = new Set(TEMAS.map((t) => montarOracao({ tema: t.id, alvo: 'vida' }).texto));
    const porAlvo = new Set(ALVOS.map((a) => montarOracao({ tema: 'armadura', alvo: a.id }).texto));
    expect(porTema.size).toBe(8);
    expect(porAlvo.size).toBe(6);
  });

  it('cada portal molda a oração e sugere um tema', () => {
    const porPortal = new Set(PORTALS.map((p) => montarOracao({ tema: 'armadura', alvo: 'vida', portal: p.id }).texto));
    expect(porPortal.size).toBe(8);
    expect(Object.keys(TEMA_DO_PORTAL)).toHaveLength(8);
    for (const p of PORTALS) expect(SABOR_PORTAL[p.id].pedido.length).toBeGreaterThan(20);
  });

  it('modalidades breve e completa', () => {
    const breve = montarOracao({ tema: 'tentacao', alvo: 'vida', modalidade: 'breve' }).texto;
    const completa = montarOracao({ tema: 'tentacao', alvo: 'vida', modalidade: 'completa' }).texto;
    expect(breve.length).toBeLessThan(completa.length / 2);
    expect(breve).toMatch(/tribunal da graça/);
    expect(breve).toMatch(/amém\.$/);
  });

  it('inclui o pedido e a pessoa sem presumir detalhes', () => {
    const o = montarOracao({ tema: 'familia', alvo: 'familia', portal: 'guerra', pedido: { titulo: 'Paz em casa', pessoa: 'meu filho' } });
    expect(o.texto).toContain('por meu filho: “Paz em casa”');
    const sem = montarOracao({ tema: 'familia', alvo: 'familia', pedido: { titulo: 'Paz', pessoa: '  ' } });
    expect(sem.texto).not.toContain(' por  ');
  });

  it('respeita os limites: sem ordens a anjos, sem diagnósticos, sem promessas, sem culpar a pessoa', () => {
    const tudo = [...todas().map((o) => o.texto + o.atitude + o.notas.join(' ')), ENCERRAMENTO.texto].join('\n');
    expect(tudo).not.toMatch(/\b(ordeno|determino|decreto|declaro que)\b/i);
    expect(tudo).not.toMatch(/anjos?,\s+(vão|vai|ide|guardem)/i);
    expect(tudo).not.toMatch(/garant|com certeza|você será curad|prosperidade garantida/i);
    expect(tudo).not.toMatch(/esp[ií]rito de\s+[A-Z]|principado de/);
    expect(tudo).not.toMatch(/você falhou|por não ter orado|sua culpa/i);
    expect(tudo).toMatch(/envies os Teus anjos/);
    expect(ENCERRAMENTO.texto).toMatch(/não porque cumpri um ritual/);
  });

  it('toda categoria do altar tem um alvo', () => {
    for (const c of CATEGORIAS) expect(ALVO_DA_CATEGORIA[c]).toBeDefined();
  });
});
