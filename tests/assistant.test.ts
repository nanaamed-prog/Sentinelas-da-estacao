import { describe, it, expect } from 'vitest';
import { Store, memoryStorage } from '@/lib/store/store';
import { montarPlano, ondeAparece, organizarPedidos, perguntasDeReflexao, AVISO } from '@/lib/assistant/local';
import { SISTEMA } from '@/lib/assistant/sistema';
import { tipoBase, validar } from '@/lib/attachments/anexos';

describe('Assistente — modo local', () => {
  it('traz perguntas da estação e do portal, vindas do e-book', () => {
    const g = perguntasDeReflexao('outono', 'silencio');
    expect(g.map((x) => x.origem)).toEqual(['Outono — Deixe Deus Podar', 'Portal do Silêncio']);
    expect(g[0].perguntas.length).toBeGreaterThan(1);
    g.flatMap((x) => x.perguntas).forEach((q) => expect(q.endsWith('?')).toBe(true));
  });

  it('organiza o altar e aponta pedidos sem revisão há 30 dias', () => {
    const s = new Store(memoryStorage());
    s.criarPedido({ titulo: 'Antigo', categoria: 'Família' });
    const db = s.getSnapshot();
    const daqui40 = new Date(Date.now() + 40 * 86_400_000);
    const o = organizarPedidos(db.pedidos, daqui40);
    expect(o.abertos).toBe(1);
    expect(o.porCategoria).toEqual([{ categoria: 'Família', total: 1 }]);
    expect(o.semRevisao[0].p.titulo).toBe('Antigo');
  });

  it('monta um plano com portais, leituras da estação e a jornada', () => {
    const s = new Store(memoryStorage());
    s.setPreferences({ portaisAtivos: ['alvorada', 'silencio'] });
    s.escolherEstacao('inverno');
    const p = montarPlano(s.getSnapshot());
    expect(p.passos[0]).toContain('Alvorada (06:00)');
    expect(p.passos[1]).toContain('Inverno');
    expect(p.passos.join(' ')).toContain('Dia 1');
  });

  it('encontra onde uma referência aparece no e-book', () => {
    expect(ondeAparece('Salmo 46').map((x) => x.slug)).toEqual(expect.arrayContaining(['inverno', 'as-oito-vigilias']));
    expect(ondeAparece('Tiago 1:5').length).toBeGreaterThan(0);
    expect(ondeAparece('xx')).toEqual([]);
  });

  it('as regras de segurança estão nas instruções da IA', () => {
    for (const r of ['Nunca afirme falar em nome de Deus', 'Nunca invente profecias', 'Nunca prometa', 'sinal divino', 'Não substitua aconselhamento']) expect(SISTEMA).toContain(r);
    expect(AVISO).toContain('Não falo em nome de Deus');
  });
});

describe('Anexos', () => {
  it('aceita foto, PDF e áudio até 10 MB', () => {
    expect(tipoBase('audio/webm;codecs=opus')).toBe('audio/webm');
    expect(validar(new Blob(['x'], { type: 'image/jpeg' }))).toBeNull();
    expect(validar(new Blob(['x'], { type: 'audio/webm;codecs=opus' }))).toBeNull();
    expect(validar(new Blob(['x'], { type: 'text/html' }))).toMatch(/não aceito/);
    expect(validar(new Blob([], { type: 'image/png' }))).toMatch(/vazio/);
  });
});
