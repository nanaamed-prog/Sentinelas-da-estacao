export type SeasonId = 'primavera' | 'verao' | 'outono' | 'inverno';

export interface Season {
  id: SeasonId;
  nome: string;
  chamado: string;
  temas: string[];
  visual: string;
  /** Período do ano no calendário espiritual do método (dia/mês). */
  periodo: { inicio: string; fim: string };
  /** gradiente usado na ilustração (sem fotos repetidas) */
  cores: [string, string, string];
}

/** Conteúdo conforme o método Sentinelas da Estação (especificação mestre). */
export const SEASONS: Season[] = [
  { id: 'primavera', nome: 'Primavera', chamado: 'Plante', periodo: { inicio: '21/03', fim: '20/06' },
    temas: ['Novos começos', 'Preparação', 'Obediência', 'Sementes', 'Constância', 'Esperança'],
    visual: 'Flores delicadas, amanhecer, vegetação nova.', cores: ['#F4C7C3', '#E9A6A1', '#7C9A6A'] },
  { id: 'verao', nome: 'Verão', chamado: 'Frutifique', periodo: { inicio: '21/06', fim: '20/09' },
    temas: ['Crescimento', 'Serviço', 'Maturidade', 'Administração', 'Frutos', 'Responsabilidade'],
    visual: 'Luz quente, folhas verdes, frutos e paisagens luminosas.', cores: ['#F6D28B', '#C58B42', '#4E6B3A'] },
  { id: 'outono', nome: 'Outono', chamado: 'Deixe Deus podar', periodo: { inicio: '21/09', fim: '20/12' },
    temas: ['Entrega', 'Renúncia', 'Simplificação', 'Revisão', 'Perdão', 'Limites'],
    visual: 'Folhas alaranjadas, tons terrosos e luz suave.', cores: ['#E7A15A', '#B4562B', '#632B2A'] },
  { id: 'inverno', nome: 'Inverno', chamado: 'Permaneça', periodo: { inicio: '21/12', fim: '20/03' },
    temas: ['Espera', 'Silêncio', 'Perseverança', 'Raízes', 'Descanso', 'Fidelidade'],
    visual: 'Montanhas frias, árvores delicadas e atmosfera serena.', cores: ['#C9D6E3', '#7D93AB', '#24384F'] },
];

export const getSeason = (id?: SeasonId | null) => SEASONS.find((s) => s.id === id);

export const periodoTexto = (s: Season) => `${s.periodo.inicio} a ${s.periodo.fim}`;

const mmdd = (ddmm: string) => { const [d, m] = ddmm.split('/').map(Number); return m * 100 + d; };

/**
 * Estação do calendário espiritual do método para uma data (somente informativo — a usuária escolhe a sua estação).
 * Os períodos não se sobrepõem: 20/12 ainda é outono, 21/12 já é inverno.
 */
export function estacaoDoCalendario(data: Date): Season {
  const v = (data.getMonth() + 1) * 100 + data.getDate();
  return SEASONS.find((s) => {
    const i = mmdd(s.periodo.inicio), f = mmdd(s.periodo.fim);
    return i <= f ? v >= i && v <= f : v >= i || v <= f;
  })!;
}
