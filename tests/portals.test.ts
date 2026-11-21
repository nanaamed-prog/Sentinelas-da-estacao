import { describe, it, expect } from 'vitest';
import { PORTALS, currentPortal, nextPortal } from '@/lib/content/portals';

const at = (h: number, m = 0) => new Date(2026, 10, 20, h, m);

describe('portais', () => {
  it('cadastra os oito portais do método, na ordem', () => {
    expect(PORTALS.map((p) => `${p.hora}-${p.nome}-${p.proposito}`)).toEqual([
      '0-Imersão-Render-se', '3-Guerra-Interceder', '6-Alvorada-Consagrar', '9-Colheita-Trabalhar',
      '12-Santidade-Separar', '15-Sabedoria-Discernir', '18-Ocaso-Recalibrar', '21-Silêncio-Entregar',
    ]);
  });
  it('identifica o portal do momento', () => {
    expect(currentPortal(at(9, 39)).id).toBe('colheita');
    expect(currentPortal(at(2, 59)).id).toBe('imersao');
  });
  it('calcula o próximo portal ativo, inclusive virando o dia', () => {
    expect(nextPortal(at(9, 39), ['alvorada', 'santidade', 'silencio'])).toMatchObject({ portal: { id: 'santidade' }, emMinutos: 141 });
    expect(nextPortal(at(22, 0), ['alvorada'])).toMatchObject({ portal: { id: 'alvorada' }, emMinutos: 480 });
    expect(nextPortal(at(6, 0), ['alvorada'])?.emMinutos).toBe(1440);
  });
  it('sem portais escolhidos não há próximo', () => {
    expect(nextPortal(at(10), [])).toBeNull();
  });
});

import { SEASONS } from '@/lib/content/seasons';
describe('estações', () => {
  it('períodos do calendário espiritual', () => {
    expect(Object.fromEntries(SEASONS.map((s) => [s.id, `${s.periodo.inicio}-${s.periodo.fim}`]))).toEqual({
      primavera: '21/03-20/06', verao: '21/06-20/09', outono: '21/09-20/12', inverno: '21/12-20/03',
    });
  });
});

import { etapasDaOracao, oracaoDoPortal } from '@/lib/content/prayers';
describe('orações por portal', () => {
  it('toda oração segue as cinco etapas, começando pelo tribunal da graça', () => {
    for (const p of PORTALS) {
      const e = etapasDaOracao(p.id, { pedido: 'Sabedoria nas decisões' });
      expect(e.map((x) => x.id)).toEqual(['entrada', 'perdao', 'gratidao', 'pedido', 'entrega']);
      expect(e[0].texto).toContain('tribunal da graça');
      expect(e[1].texto).toMatch(/perdo/i);
      expect(e[3].texto).toContain('“Sabedoria nas decisões”');
      expect(e[4].texto).toMatch(/amém\.$/);
    }
  });
  it('cada portal molda o pedido de forma diferente', () => {
    const pedidos = PORTALS.map((p) => etapasDaOracao(p.id, { pedido: 'X' })[3].texto);
    expect(new Set(pedidos).size).toBe(8);
  });
  it('inclui a pessoa ou assunto quando informado', () => {
    expect(oracaoDoPortal('guerra', { pedido: 'Saúde', pessoa: 'minha mãe' })).toContain('Intercedo por minha mãe');
    expect(oracaoDoPortal('silencio', { pedido: 'Saúde', pessoa: '  ' })).not.toContain(' por  ');
  });
});
