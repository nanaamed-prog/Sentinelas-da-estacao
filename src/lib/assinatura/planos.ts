/**
 * Planos e recursos — configuração compartilhada (sem segredos).
 * Os valores oficiais vêm da tabela `planos` no banco; estes são apenas o padrão exibido sem conexão.
 */
export type PlanoId = 'mensal' | 'anual';
export interface Plano { id: PlanoId; nome: string; periodicidade: 'mes' | 'ano'; valorCentavos: number; moeda: string; disponivel: boolean }

export const PLANOS_PADRAO: Plano[] = [
  { id: 'mensal', nome: 'Sentinelas Completo — mensal', periodicidade: 'mes', valorCentavos: 1990, moeda: 'BRL', disponivel: false },
  { id: 'anual', nome: 'Sentinelas Completo — anual', periodicidade: 'ano', valorCentavos: 19700, moeda: 'BRL', disponivel: false },
];

export const reais = (centavos: number) =>
  (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/ /g, ' ');

/** Valor total e periodicidade, sempre explícitos (o anual nunca aparece como valor mensal). */
export function precoPorExtenso(p: Pick<Plano, 'valorCentavos' | 'periodicidade'>) {
  return p.periodicidade === 'mes'
    ? `${reais(p.valorCentavos)} por mês, renovação automática mensal`
    : `${reais(p.valorCentavos)} por ano, cobrados de uma vez, renovação automática anual`;
}

/**
 * Recursos do Sentinelas Completo — somente o que já existe no app.
 * Itens do pedido original ainda não implementados (jornadas de batalha espiritual, estudos bíblicos,
 * jornadas por estação) NÃO aparecem aqui até serem publicados.
 */
export type RecursoId = 'oracoes' | 'biblioteca' | 'altar' | 'vigilias' | 'diario' | 'assistente' | 'ia';

export const RECURSOS: Record<RecursoId, { nome: string; beneficio: string }> = {
  oracoes: { nome: 'Orações de batalha espiritual', beneficio: 'Orações organizadas por tema (8) e alvo de intercessão (6), nas versões breve, completa e guiada, moldadas pelos oito portais.' },
  biblioteca: { nome: 'Biblioteca completa', beneficio: 'Todos os capítulos do livro Sentinelas da Estação: as quatro estações, os oito portais, o discernimento e o diário, com leituras e reflexões.' },
  altar: { nome: 'Meu Altar', beneficio: 'Planejamento pessoal de intercessão: pedidos, recalibração, histórico e testemunhos.' },
  vigilias: { nome: 'Vigílias registradas', beneficio: 'Iniciar vigílias nos portais, escrever a sua oração e guardar o histórico.' },
  diario: { nome: 'Diário da sentinela', beneficio: 'Registros de Palavra, oração, discernimento e gratidão, com anexos.' },
  assistente: { nome: 'Assistente de oração', beneficio: 'Estruturar orações, organizar pedidos, recalibrar e montar um plano devocional.' },
  ia: { nome: 'IA avançada da assistente', beneficio: 'Conversa com a assistente devocional, dentro de limites bíblicos e de privacidade.' },
};

/** Ordem exibida na página de planos (a IA só aparece quando estiver ativada no servidor). */
export const RECURSOS_COMPLETO: RecursoId[] = ['oracoes', 'biblioteca', 'altar', 'vigilias', 'diario', 'assistente'];

export const RECURSOS_GRATUITOS = [
  'Oração do dia e Palavra do dia',
  'Apresentação das quatro estações espirituais',
  'Consulta aos oito horários dos portais e lembretes',
  'Jornada introdutória de sete dias',
  'Capítulos de abertura da Biblioteca',
];

/** Capítulos da Biblioteca abertos a todas (apresentação do método). */
export const CAPITULOS_GRATUITOS = ['a-jornada-da-sentinela', 'o-deus-das-estacoes'];

/** Caminho interno seguro para voltar depois do checkout (nunca outro domínio). */
export function caminhoSeguro(v: string | null | undefined, padrao = '/'): string {
  if (!v || !v.startsWith('/') || v.startsWith('//') || v.includes('\\') || /[\u0000-\u001f]/.test(v)) return padrao;
  return v.slice(0, 200);
}

/** Lê um parâmetro do endereço (também na prévia, que usa #rota?param=valor). */
export function parametro(nome: string): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(nome) ?? new URLSearchParams(window.location.hash.split('?')[1] ?? '').get(nome);
}
