import { describe, it, expect } from 'vitest';
import { CAPITULOS, LIVRO, oracaoDaEstacao } from '@/lib/content/ebook';
import { PORTALS } from '@/lib/content/portals';

describe('Biblioteca (e-book)', () => {
  it('tem os capítulos previstos na especificação', () => {
    const t = CAPITULOS.map((c) => c.titulo);
    for (const x of ['O Deus das Estações', 'O Chamado da Sentinela', 'Discernindo sua Estação', 'Primavera — Plante', 'Verão — Frutifique',
      'Outono — Deixe Deus Podar', 'Inverno — Permaneça', 'Os Oito Portais', 'Meu Altar de Intercessão', 'Diário da Sentinela', 'Plano de 7 Dias']) {
      expect(t).toContain(x);
    }
    expect(LIVRO.autora).toBe('Naiara de Medeiros');
  });

  it('o texto ficou limpo (sem palavras decorativas soltas em caixa alta)', () => {
    for (const c of CAPITULOS) for (const s of c.secoes) for (const p of s.paragrafos) {
      expect(p.replace(/\*\*[^*]+\*\*/g, '')).not.toMatch(/\b[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{3,}\b/);
      expect(p.trim().length).toBeGreaterThan(10);
    }
  });

  it('cada portal recebe explicação, leituras e perguntas do e-book', () => {
    for (const p of PORTALS) {
      expect(p.explicacao, p.nome).toBeTruthy();
      expect(p.referencias!.length, p.nome).toBeGreaterThan(0);
      expect(p.perguntas!.length, p.nome).toBe(3);
    }
  });

  it('cada estação tem sua oração', () => {
    for (const id of ['primavera', 'verao', 'outono', 'inverno'] as const) expect(oracaoDaEstacao(id)?.reflexao).toMatch(/^(Pai|Senhor)/);
  });
});
