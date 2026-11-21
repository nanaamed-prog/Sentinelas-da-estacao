import { describe, it, expect } from 'vitest';
import { Store, memoryStorage } from '@/lib/store/store';
import { JORNADA } from '@/lib/content/journey';
import { eventos, gradeDoMes, porDia, chaveDia } from '@/lib/calendar/events';

describe('Minha Jornada', () => {
  it('tem os sete dias do método, na ordem', () => {
    expect(JORNADA.map((d) => d.titulo)).toEqual([
      'Palavra e identificação da estação', 'Organização do altar', 'Escolha dos portais', 'Vigilância do coração',
      'Recalibração de uma oração', 'Silêncio e oração', 'Revisão e continuidade',
    ]);
    JORNADA.forEach((d) => { expect(d.explicacao && d.leitura && d.reflexao && d.exercicio).toBeTruthy(); });
  });

  it('registra, conclui e reabre dias', () => {
    const s = new Store(memoryStorage());
    s.iniciarJornada();
    s.registrarDia(3, 'Alvorada e Silêncio');
    s.concluirDia(3);
    expect(s.jornadaAtual?.dias.find((d) => d.dia === 3)).toMatchObject({ registro: 'Alvorada e Silêncio' });
    expect(s.jornadaAtual?.dias.find((d) => d.dia === 3)?.concluidoEm).toBeTruthy();
    s.reabrirDia(3);
    expect(s.jornadaAtual?.dias.find((d) => d.dia === 3)?.concluidoEm).toBeUndefined();
  });

  it('reiniciar cria novo ciclo sem perder o histórico', () => {
    const s = new Store(memoryStorage());
    s.iniciarJornada(); s.registrarDia(1, 'primeira vez'); s.concluirDia(1);
    s.iniciarJornada(true);
    expect(s.getSnapshot().jornada).toHaveLength(2);
    expect(s.jornadaAtual?.ciclo).toBe(2);
    expect(s.getSnapshot().jornada[0].dias[0].registro).toBe('primeira vez');
  });

  it('dados antigos (sem jornada) continuam abrindo', () => {
    const antigo = JSON.stringify({ versao: 1, preferencias: {}, estacoes: [], pedidos: [], vigilias: [], diario: [] });
    const s = new Store(memoryStorage(antigo));
    expect(s.getSnapshot().jornada).toEqual([]);
  });
});

describe('Calendário', () => {
  it('reúne vigílias, diário, estações, pedidos, recalibrações, testemunhos e jornada por dia', () => {
    const s = new Store(memoryStorage());
    s.escolherEstacao('outono');
    const p = s.criarPedido({ titulo: 'Família' });
    s.recalibrar(p.id, { oQueMudou: 'a', oQuePermanece: '', novaNecessidade: '', atitude: '' });
    s.mudarStatus(p.id, 'Respondido', 'Graças');
    const v = s.iniciarVigilia('alvorada'); s.concluirVigilia(v.id);
    s.salvarRegistro({ titulo: 'Hoje' });
    s.iniciarJornada(); s.concluirDia(1);
    const tipos = new Set(eventos(s.getSnapshot()).map((e) => e.tipo));
    expect([...tipos].sort()).toEqual(['diario', 'estacao', 'jornada', 'pedido', 'recalibracao', 'testemunho', 'vigilia']);
    expect(porDia(eventos(s.getSnapshot())).get(chaveDia(new Date()))!.length).toBe(7);
  });

  it('a grade do mês começa no dia da semana certo', () => {
    const g = gradeDoMes(2026, 10); // novembro de 2026 começa num domingo
    expect(g[0]?.getDate()).toBe(1);
    expect(g.length % 7).toBe(0);
    expect(g.filter(Boolean)).toHaveLength(30);
  });
});

import { diarioEmTexto } from '@/lib/journal/export';
describe('Exportar diário', () => {
  it('gera texto legível em ordem cronológica', () => {
    const s = new Store(memoryStorage());
    s.salvarRegistro({ titulo: 'Segundo', data: '2026-11-21T10:00:00.000Z', texto: 'B' });
    s.salvarRegistro({ titulo: 'Primeiro', data: '2026-11-20T10:00:00.000Z', texto: 'A', tipo: 'Gratidão', referencia: 'Salmo 103:2', estacao: 'outono', marcadores: ['família'] });
    const t = diarioEmTexto(s.getSnapshot().diario, 'Naiara');
    expect(t).toContain('DIÁRIO DA SENTINELA');
    expect(t).toContain('Naiara');
    expect(t.indexOf('Primeiro')).toBeLessThan(t.indexOf('Segundo'));
    expect(t).toContain('Gratidão · Salmo 103:2 · Outono');
    expect(t).toContain('Marcadores: família');
  });
});
