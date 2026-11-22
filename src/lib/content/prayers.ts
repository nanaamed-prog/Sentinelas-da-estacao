import type { PortalId } from './portals';

/**
 * Orações orientadas por portal (modo local, sem IA).
 * Estrutura de cada oração:
 *   1. Entrada no tribunal da graça
 *   2. Confissão e perdão
 *   3. Gratidão
 *   4. Pedido — moldado pela intenção do portal
 *   5. Entrega e fechamento
 *
 * Regras: não falam em nome de Deus, não prometem resultados e não citam texto bíblico.
 * TEXTOS EDITÁVEIS PELA AUTORA — altere aqui para ajustar ao método.
 */
export interface AlvoOracao {
  /** título do pedido, ex.: "Sabedoria nas decisões" */
  pedido: string;
  /** pessoa ou assunto, ex.: "minha mãe" (opcional) */
  pessoa?: string;
}

export type EtapaId = 'entrada' | 'perdao' | 'gratidao' | 'pedido' | 'entrega';
export interface Etapa { id: EtapaId; titulo: string; texto: string }

export const TITULOS_ETAPAS: Record<EtapaId, string> = {
  entrada: 'Entrada no tribunal da graça',
  perdao: 'Confissão e perdão',
  gratidao: 'Gratidão',
  pedido: 'Pedido',
  entrega: 'Entrega',
};

type Modelo = {
  entrada: string;
  perdao: string;
  gratidao: string;
  pedido: (a: { por: string; pedido: string }) => string;
  entrega: string;
};

const ENTRADA_BASE =
  'Pai, em nome de Jesus eu me aproximo do tribunal da graça. Não venho pelos meus méritos, mas pelo sangue de Jesus, que me dá acesso à Tua presença.';
const PERDAO_FIM = 'Recebo o Teu perdão e a Tua purificação.';
const AMEM = 'Em nome de Jesus, amém.';

const MODELOS: Record<PortalId, Modelo> = {
  imersao: {
    entrada: `${ENTRADA_BASE} Nesta madrugada, enquanto tudo silencia, eu me rendo diante de Ti.`,
    perdao: `Confesso os meus pecados. Perdoa-me pelas vezes em que quis controlar o que só Tu podes conduzir e pelas vezes em que confiei mais em mim do que em Ti. ${PERDAO_FIM}`,
    gratidao: 'Eu Te agradeço porque a Tua presença não dorme e porque posso descansar na Tua soberania.',
    pedido: ({ por, pedido }) =>
      `Entrego em Tuas mãos este pedido${por}: ${pedido}. Não quero conduzir isto pela minha força nem pela minha pressa. Rendo meus planos, meus medos e o resultado que eu esperava. Que a Tua vontade seja maior do que a minha neste assunto.`,
    entrega: `Eu me rendo a Ti por inteiro. ${AMEM}`,
  },
  guerra: {
    entrada: `${ENTRADA_BASE} Nesta vigília da madrugada, eu me coloco na brecha diante de Ti.`,
    perdao: `Confesso os meus pecados e as falhas que cometi por descuido, mágoa ou desobediência. Perdoa-me. Também libero o perdão a quem me feriu, para que nada impeça a minha oração. ${PERDAO_FIM}`,
    gratidao: 'Eu Te agradeço porque a vitória pertence a Ti e porque não estou sozinha nesta batalha.',
    pedido: ({ por, pedido }) =>
      `Intercedo${por}: ${pedido}. Peço que a Tua mão guarde, proteja e afaste tudo o que se levanta contra o Teu cuidado nesta situação. Não luto com as minhas armas, mas com oração, com a Palavra e com fé.`,
    entrega: `Fortalece o meu coração para permanecer intercedendo, confiando na Tua resposta, seja ela qual for. ${AMEM}`,
  },
  alvorada: {
    entrada: `${ENTRADA_BASE} Neste amanhecer, antes de qualquer outra voz, eu busco a Tua face.`,
    perdao: `Confesso os meus pecados. Perdoa-me pelos dias em que comecei sem Ti e pelo que carrego de ontem. Lava o meu coração para que eu comece este dia limpa diante de Ti. ${PERDAO_FIM}`,
    gratidao: 'Eu Te agradeço pela vida, por este novo dia e pelas Tuas misericórdias que se renovam.',
    pedido: ({ por, pedido }) =>
      `Consagro a Ti o meu dia e este pedido${por}: ${pedido}. Que as primeiras horas sejam Tuas e que tudo o que eu fizer hoje sobre isto seja feito debaixo do Teu cuidado.`,
    entrega: `Ensina-me a caminhar este dia em obediência. ${AMEM}`,
  },
  colheita: {
    entrada: `${ENTRADA_BASE} No início do trabalho deste dia, eu paro primeiro diante de Ti.`,
    perdao: `Confesso os meus pecados. Perdoa-me pela ansiedade, pela murmuração e pelas vezes em que trabalhei como se tudo dependesse só de mim. ${PERDAO_FIM}`,
    gratidao: 'Eu Te agradeço pelo trabalho, pela provisão de cada dia e pelas sementes que já plantaste em minha vida.',
    pedido: ({ por, pedido }) =>
      `Apresento a Ti este pedido${por}: ${pedido}. Mostra-me o que cabe a mim fazer com diligência e o que cabe somente a Ti. Abençoa o trabalho das minhas mãos e ajuda-me a semear com fidelidade, mesmo antes de ver os frutos.`,
    entrega: `Coloco o fruto deste trabalho nas Tuas mãos. ${AMEM}`,
  },
  santidade: {
    entrada: `${ENTRADA_BASE} No meio do dia, eu me separo deste barulho para estar contigo.`,
    perdao: `Sonda o meu coração. Confesso os meus pecados, inclusive os que ninguém vê: pressa, ressentimento, comparação e medo. Perdoa-me e separa em mim o que é Teu do que não Te agrada. ${PERDAO_FIM}`,
    gratidao: 'Eu Te agradeço porque me chamaste para viver separada para Ti e porque a Tua graça me sustenta no meio do dia.',
    pedido: ({ por, pedido }) =>
      `Trago este pedido${por}: ${pedido}. Guarda o meu coração de tudo o que contamina nesta situação, para que eu trate este assunto com pureza e verdade — nas motivações, nas palavras e nas atitudes.`,
    entrega: `Separo para Ti este pedido e a minha vida. ${AMEM}`,
  },
  sabedoria: {
    entrada: `${ENTRADA_BASE} Nesta tarde, eu venho buscar a Tua direção.`,
    perdao: `Confesso os meus pecados. Perdoa-me pelas decisões que tomei sem Te consultar e pelas vezes em que segui apenas as minhas emoções. ${PERDAO_FIM}`,
    gratidao: 'Eu Te agradeço porque a Tua Palavra é luz para o meu caminho e porque dás sabedoria a quem Te pede.',
    pedido: ({ por, pedido }) =>
      `Preciso de sabedoria sobre este pedido${por}: ${pedido}. Ajuda-me a discernir o que é direção Tua, o que é emoção minha e o que é apenas circunstância. Abre os meus olhos para a Tua Palavra e coloca pessoas sábias no meu caminho.`,
    entrega: `Que eu dê o próximo passo com prudência e paz. ${AMEM}`,
  },
  ocaso: {
    entrada: `${ENTRADA_BASE} Ao fim da tarde, eu volto o meu coração para Ti.`,
    perdao: `Confesso os meus pecados deste dia, em pensamentos, palavras e atitudes. Perdoa-me onde me desviei e onde deixei de fazer o bem que eu podia. ${PERDAO_FIM}`,
    gratidao: 'Eu Te agradeço por tudo o que me sustentou até aqui, inclusive pelo que eu ainda não compreendo.',
    pedido: ({ por, pedido }) =>
      `Reviso diante de Ti este pedido${por}: ${pedido}. Mostra-me o que mudou, o que permanece e como devo orar daqui em diante. Onde me desviei, corrige a minha rota; onde me cansei, renova a minha esperança.`,
    entrega: `Recalibro o meu coração ao Teu. ${AMEM}`,
  },
  silencio: {
    entrada: `${ENTRADA_BASE} Antes de descansar, eu me aquieto diante de Ti.`,
    perdao: `Confesso os meus pecados e as falhas deste dia. Perdoa-me, e eu também libero o perdão a quem me ofendeu, para não levar mágoa para a noite. ${PERDAO_FIM}`,
    gratidao: 'Eu Te agradeço por este dia, pelo cuidado que tive e pelo descanso que me ofereces.',
    pedido: ({ por, pedido }) =>
      `Entrego em Tuas mãos este pedido${por}: ${pedido}. Não preciso carregar isto durante a noite. Acalma os meus pensamentos e guarda o meu sono.`,
    entrega: `Descanso sabendo que este assunto está diante de Ti. Em Tuas mãos eu deixo este dia. ${AMEM}`,
  },
};

export function etapasDaOracao(portal: PortalId, alvo: AlvoOracao): Etapa[] {
  const m = MODELOS[portal];
  const pessoa = alvo.pessoa?.trim();
  const textos: Record<EtapaId, string> = {
    entrada: m.entrada,
    perdao: m.perdao,
    gratidao: m.gratidao,
    pedido: m.pedido({ por: pessoa ? ` por ${pessoa}` : '', pedido: `“${alvo.pedido.trim()}”` }),
    entrega: m.entrega,
  };
  return (Object.keys(TITULOS_ETAPAS) as EtapaId[]).map((id) => ({ id, titulo: TITULOS_ETAPAS[id], texto: textos[id] }));
}

/** Oração completa em texto corrido (para copiar ou usar na vigília). */
export function oracaoDoPortal(portal: PortalId, alvo: AlvoOracao): string {
  return etapasDaOracao(portal, alvo).map((e) => e.texto).join('\n\n');
}

export const PORTAIS_COM_ORACAO = Object.keys(MODELOS) as PortalId[];

/**
 * “Sabor” de cada portal, reaproveitado pelas orações de batalha espiritual (batalha.ts):
 * a frase do momento, a confissão, a intenção do pedido e a entrega próprias do horário.
 */
export interface SaborPortal { momento: string; perdao: string; pedido: string; entrega: string }
export const SABOR_PORTAL = Object.fromEntries(
  (Object.entries(MODELOS) as [PortalId, Modelo][]).map(([id, m]) => [id, {
    momento: m.entrada.replace(ENTRADA_BASE, '').trim(),
    perdao: m.perdao,
    pedido: m.pedido({ por: '', pedido: '§' }).split('§.')[1]?.trim() ?? '',
    entrega: m.entrega,
  }]),
) as Record<PortalId, SaborPortal>;
