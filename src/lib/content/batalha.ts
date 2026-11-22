/**
 * Orações de batalha espiritual — modo local (sem IA).
 *
 * Direção: orar com firmeza contra o mal, pedir proteção a Deus e assumir responsabilidade pelas próprias atitudes.
 * Base principal: Efésios 6:10-18; Tiago 4:7-8; 1 Pedro 5:8-9; 2 Coríntios 10:3-5; Mateus 6:9-13; Romanos 12:21.
 *
 * Limites (não negociáveis):
 * - Nada aqui diagnostica ação demoníaca em doenças, finanças, conflitos, sonhos ou emoções.
 * - Pessoas, religiões e grupos nunca são tratados como inimigos (Efésios 6:12).
 * - Sem nomes, hierarquias ou funções de demônios e anjos; a Deus pedimos que envie Seus anjos — não damos ordens a eles.
 * - Sem promessa de cura, prosperidade ou livramento automático; textos bíblicos não são fórmulas de garantia.
 * - Os horários dos portais são oportunidades de oração, sem poder espiritual próprio.
 * Os textos ficam em src/lib/conteudo-pago/oracoes.ts (servidor); aqui só a montagem.
 */
import { getPortal, nomePortal, type PortalId } from './portals';
import { SABOR_PORTAL } from './prayers';

export type TemaId = 'armadura' | 'tentacao' | 'renuncia' | 'familia' | 'discernimento' | 'habitos' | 'perseveranca' | 'paz';
export type AlvoId = 'vida' | 'familia' | 'lar' | 'relacionamentos' | 'trabalho' | 'igreja';
export type Modalidade = 'breve' | 'completa' | 'guiada';

export interface Tema {
  id: TemaId;
  nome: string;
  resumo: string;
  referencias: string[];
  /** comportamentos a renunciar (identificáveis, sem diagnóstico espiritual), já com a preposição: “à mentira…” */
  renuncia: string;
  /** fortalecimento específico do tema (a armadura tem o seu próprio) */
  fortalecimento?: string;
  resistencia: string;
  atitude: string;
  /** indicação de interpretação devocional, quando necessária */
  nota?: string;
}

export interface Alvo { id: AlvoId; nome: string; objeto: string; intercessao: string; breve: string }

/** Tema sugerido para cada portal, conforme a intenção do horário. */
export const TEMA_DO_PORTAL: Record<PortalId, TemaId> = {
  imersao: 'renuncia', guerra: 'familia', alvorada: 'armadura', colheita: 'perseveranca',
  santidade: 'tentacao', sabedoria: 'discernimento', ocaso: 'habitos', silencio: 'paz',
};

/** Alvo sugerido a partir da categoria de um pedido do altar. */
export const ALVO_DA_CATEGORIA: Record<string, AlvoId> = {
  Família: 'familia', Filhos: 'familia', 'Casamento e relacionamentos': 'relacionamentos', Trabalho: 'trabalho',
  Finanças: 'trabalho', Igreja: 'igreja', Saúde: 'vida', 'Vida espiritual': 'vida', Outros: 'vida',
};

export interface Encerramento { titulo: string; referencias: string[]; texto: string; atitude: string }
/** Textos das orações (plano completo), recebidos do servidor. */
export interface DadosOracoes { temas: Tema[]; alvos: Alvo[]; encerramento: Encerramento }

/** Nomes dos alvos (sem o texto das orações), usados também na página de planos. */
export const NOMES_ALVOS: Record<AlvoId, string> = {
  vida: 'Minha vida', familia: 'Filhos e família', lar: 'Lar', relacionamentos: 'Relacionamentos', trabalho: 'Trabalho e provisão', igreja: 'Igreja e comunidade',
};

export interface EtapaOracao { id: string; titulo: string; texto: string }
export interface Oracao {
  titulo: string;
  tema: string;
  referencias: string[];
  etapas: EtapaOracao[];
  /** oração em texto corrido (breve ou completa) */
  texto: string;
  atitude: string;
  notas: string[];
}

export interface OpcoesOracao {
  tema: TemaId;
  alvo: AlvoId;
  modalidade?: Modalidade;
  portal?: PortalId;
  /** pedido do altar (opcional) */
  pedido?: { titulo: string; pessoa?: string };
}

const AMEM = 'Em nome de Jesus, amém.';
const semAmem = (t: string) => t.replace(/\s*Em nome de Jesus, amém\.\s*$/, '').trim();

export function montarOracao(o: OpcoesOracao, dados: DadosOracoes): Oracao {
  const tema = dados.temas.find((t) => t.id === o.tema) ?? dados.temas[0];
  const alvo = dados.alvos.find((a) => a.id === o.alvo) ?? dados.alvos[0];
  const portal = o.portal ? getPortal(o.portal) : undefined;
  const sabor = o.portal ? SABOR_PORTAL[o.portal] : undefined;
  const pessoa = o.pedido?.pessoa?.trim();
  const pedido = o.pedido ? `“${o.pedido.titulo.trim()}”` : '';

  const etapas: EtapaOracao[] = [
    { id: 'adoracao', titulo: 'Adoração e entrada no tribunal da graça',
      texto: `Pai, em nome de Jesus eu me aproximo do tribunal da graça. Tu és santo, soberano e fiel; nada está fora do Teu governo, e o Teu nome está acima de todo nome.${sabor ? ' ' + sabor.momento : ''}` },
    { id: 'confissao', titulo: 'Confissão e renúncia',
      texto: `${sabor ? sabor.perdao : 'Confesso os meus pecados e recebo o Teu perdão.'} Renuncio ${tema.renuncia}, e a tudo o que em mim resiste à Tua vontade.` },
    { id: 'revestimento', titulo: 'Fortalecimento',
      texto: tema.fortalecimento ?? 'Fortalece-me no Senhor e na força do Teu poder. Reveste-me da Tua armadura — verdade, justiça, fé e a Tua Palavra — para que eu permaneça firme.' },
    { id: 'resistencia', titulo: 'Resistência em nome de Jesus', texto: tema.resistencia },
    { id: 'intercessao', titulo: 'Intercessão',
      texto: `${alvo.intercessao}${o.pedido ? ` Apresento também este pedido${pessoa ? ` por ${pessoa}` : ''}: ${pedido}.${sabor ? ' ' + sabor.pedido : ''}` : ''}` },
    { id: 'protecao', titulo: 'Proteção e direção',
      texto: `Guarda ${alvo.objeto} debaixo da Tua mão. Também Te peço que envies os Teus anjos para guardar e proteger, segundo a Tua vontade, e que o Teu Espírito Santo me conduza com discernimento em cada decisão.` },
    { id: 'entrega', titulo: 'Entrega e compromisso',
      texto: `Entrego a Ti esta oração e assumo a minha parte: quero viver hoje aquilo que orei, com atitudes concretas. ${semAmem(sabor?.entrega ?? 'Confio em Ti.')} ${AMEM}` },
  ];

  const breve = [
    `Pai, em nome de Jesus eu me aproximo do tribunal da graça.${sabor ? ' ' + sabor.momento : ''}`,
    `Perdoa os meus pecados; renuncio ${tema.renuncia}.`,
    tema.resistencia.split(/(?<=\.)\s+/).slice(0, 2).join(' '),
    o.pedido ? `${alvo.breve} Coloco diante de Ti ${pedido}${pessoa ? `, por ${pessoa}` : ''}.` : alvo.breve,
    `Guarda-nos debaixo da Tua mão. ${AMEM}`,
  ].join(' ');

  const modalidade = o.modalidade ?? 'completa';
  const notas = [tema.nota, portal ? `O horário do ${nomePortal(portal)} é uma oportunidade de oração, não tem poder espiritual próprio; associações de horários, dias e estações são organização devocional.` : undefined]
    .filter(Boolean) as string[];

  return {
    titulo: `${tema.nome}${o.pedido ? ` — ${o.pedido.titulo.trim()}` : ` — ${alvo.nome}`}`,
    tema: tema.nome,
    referencias: [...new Set([...tema.referencias, ...(portal?.referencias ?? [])])],
    etapas,
    texto: modalidade === 'breve' ? breve : etapas.map((e) => e.texto).join('\n\n'),
    atitude: tema.atitude,
    notas,
  };
}

