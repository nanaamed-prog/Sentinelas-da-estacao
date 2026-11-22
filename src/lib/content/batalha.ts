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
 * TEXTOS EDITÁVEIS PELA AUTORA.
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

export const TEMAS: Tema[] = [
  {
    id: 'armadura', nome: 'Armadura de Deus', resumo: 'Revestir-se de Cristo para permanecer firme',
    referencias: ['Efésios 6:10-18', 'Romanos 13:12'],
    renuncia: 'à autossuficiência e à tentativa de vencer pela minha própria força',
    fortalecimento:
      'Fortalece-me no Senhor e na força do Teu poder. Pela fé, eu me revisto da armadura que Tu me dás: cinjo-me com a verdade, visto a couraça da justiça, calço a prontidão do evangelho da paz, tomo o escudo da fé, o capacete da salvação e a espada do Espírito, que é a Tua Palavra.',
    resistencia:
      'Em nome de Jesus, permaneço firme contra as ciladas do mal. Não luto contra pessoas, mas contra as forças espirituais do mal, e não luto sozinha: estou apoiada na vitória de Cristo. Com o escudo da fé, recuso as setas da mentira, do medo e da acusação.',
    atitude: 'Leia Efésios 6:10-18 devagar e escolha uma peça da armadura para viver hoje — por exemplo, falar a verdade numa conversa difícil.',
    nota: 'A armadura é uma imagem bíblica para viver em Cristo — verdade, justiça, paz, fé, salvação e Palavra. Não é um ritual que precisa ser repetido para ficar protegida.',
  },
  {
    id: 'tentacao', nome: 'Resistência à tentação', resumo: 'Sujeitar-se a Deus e resistir ao mal',
    referencias: ['Tiago 4:7-8', '1 Coríntios 10:13', 'Mateus 6:13'],
    renuncia: 'às pequenas concessões que abrem caminho para o pecado e às desculpas que eu mesma invento',
    resistencia:
      'Não me deixes cair em tentação, mas livra-me do mal. Eu me sujeito a Ti e, em nome de Jesus, resisto ao diabo e a tudo o que tenta me afastar de Ti. Quando a tentação vier, abre os meus olhos para a saída que Tu provês e dá-me coragem para tomá-la.',
    atitude: 'Identifique o momento do dia em que a tentação costuma aparecer e decida antes uma saída concreta: mudar de ambiente, deixar o celular longe ou falar com alguém de confiança.',
  },
  {
    id: 'renuncia', nome: 'Renúncia e arrependimento', resumo: 'Voltar-se para Deus com o coração inteiro',
    referencias: ['1 João 1:9', 'Salmo 51:10', 'Romanos 8:1', 'Tiago 4:8'],
    renuncia: 'à mentira, à murmuração, ao orgulho, à amargura e ao desejo de controlar os outros',
    resistencia:
      'Em nome de Jesus, não permito que a culpa me paralise nem que a acusação tenha a última palavra: em Cristo não há condenação, e o Teu perdão me dá um novo começo. Cria em mim um coração puro e renova em mim um espírito inabalável.',
    atitude: 'Escolha um comportamento para abandonar nesta semana e um passo de reparação — como pedir perdão a alguém ou corrigir algo que você disse.',
  },
  {
    id: 'familia', nome: 'Proteção da família e do lar', resumo: 'Guardar a casa debaixo da mão de Deus',
    referencias: ['Josué 24:15', 'Salmo 127:1', 'Salmo 91:11', 'Efésios 6:12'],
    renuncia: 'às palavras duras, à impaciência e ao hábito de culpar os outros dentro de casa',
    resistencia:
      'Em nome de Jesus, resisto a toda obra do mal que queira semear divisão, mentira e desânimo no meu lar. Que nada roube a paz, o perdão e o amor entre nós. As pessoas da minha casa não são minhas inimigas; a minha luta é em oração, e a vitória é Tua.',
    atitude: 'Faça hoje um gesto de cuidado em casa: uma palavra de bênção, um pedido de perdão ou alguns minutos de oração juntos.',
    nota: 'Pedimos a Deus que guarde a casa e envie Seus anjos; não damos ordens a anjos nem tratamos familiares como inimigos (Efésios 6:12).',
  },
  {
    id: 'discernimento', nome: 'Discernimento e vigilância', resumo: 'Vigiar com sobriedade, à luz da Palavra',
    referencias: ['1 Pedro 5:8-9', '2 Coríntios 10:3-5', 'Filipenses 1:9-10'],
    renuncia: 'à pressa em concluir, à curiosidade por sinais e à desatenção com a Tua Palavra',
    resistencia:
      'Dá-me um espírito sóbrio e vigilante. Em nome de Jesus, rejeito as mentiras que tentam distorcer quem Tu és e quem eu sou em Ti, e levo cativo todo pensamento à obediência de Cristo. Firme na fé, resisto ao inimigo sem medo, sabendo que outros irmãos atravessam as mesmas lutas.',
    atitude: 'Antes de uma decisão importante, escreva os fatos, o que a Palavra deixa claro e busque o conselho de alguém maduro na fé.',
    nota: 'Vigiar não é ver sinais em tudo. Pensamentos, impressões e coincidências são examinados à luz das Escrituras (1 Tessalonicenses 5:21).',
  },
  {
    id: 'habitos', nome: 'Libertação de hábitos pecaminosos', resumo: 'Romper com o que escraviza',
    referencias: ['Romanos 6:12-14', 'Gálatas 5:1', 'Romanos 12:21'],
    renuncia: 'ao hábito que tem me dominado e aos pensamentos que o justificam',
    resistencia:
      'Em nome de Jesus, recuso a escravidão a este hábito. O pecado não precisa reinar sobre mim, porque estou debaixo da Tua graça. Não quero ser vencida pelo mal, mas vencer o mal com o bem — um dia de cada vez, com a Tua força e com a ajuda das pessoas que colocaste ao meu redor.',
    atitude: 'Dê um passo concreto hoje: tire o gatilho do seu alcance e conte a alguém de confiança. Em casos de vício, busque também ajuda pastoral e profissional.',
    nota: 'Libertação, aqui, é caminho de arrependimento, graça e novos hábitos. Buscar acompanhamento pastoral ou profissional não é falta de fé.',
  },
  {
    id: 'perseveranca', nome: 'Perseverança em tempos difíceis', resumo: 'Permanecer quando tudo pesa',
    referencias: ['2 Coríntios 4:8-9', 'Romanos 12:12', '1 Pedro 5:10', 'João 16:33'],
    renuncia: 'à murmuração, à autopiedade e à pressa por respostas',
    resistencia:
      'Em nome de Jesus, resisto ao desânimo e à mentira de que Tu me abandonaste. Posso estar cansada, mas não estou derrotada; posso não entender, mas não estou sozinha. Sustenta-me na esperança e na oração, e dá-me paciência na tribulação.',
    atitude: 'Faça hoje a próxima coisa certa, mesmo pequena — e descanse quando o corpo pedir.',
    nota: 'Dificuldades não provam ataque espiritual nem falta de fé; fazem parte da vida neste mundo, onde Cristo prometeu estar conosco.',
  },
  {
    id: 'paz', nome: 'Paz e descanso após a intercessão', resumo: 'Entregar e descansar em Deus',
    referencias: ['Filipenses 4:6-7', 'Salmo 4:8', 'Mateus 11:28', '1 Pedro 5:7'],
    renuncia: 'à ansiedade que quer me manter vigiando com medo e à ilusão de que tudo depende de mim',
    resistencia:
      'Em nome de Jesus, recuso o medo e a inquietação. Lanço sobre Ti toda a minha ansiedade, porque Tu cuidas de mim, e deixo que a Tua paz, que excede todo entendimento, guarde o meu coração e a minha mente.',
    atitude: 'Desligue as notificações por alguns minutos, respire com calma e volte às suas responsabilidades em paz.',
  },
];

export interface Alvo { id: AlvoId; nome: string; objeto: string; intercessao: string; breve: string }

/** Orientam a oração sem presumir detalhes que a usuária não informou. */
export const ALVOS: Alvo[] = [
  { id: 'vida', nome: 'Minha vida', objeto: 'a minha vida',
    intercessao: 'Coloco diante de Ti a minha própria vida: meu corpo, minha mente, minhas emoções, minhas escolhas e o propósito que tens para mim.',
    breve: 'Guarda a minha vida e conduz os meus passos.' },
  { id: 'familia', nome: 'Filhos e família', objeto: 'os meus filhos e a minha família',
    intercessao: 'Intercedo pelos meus filhos e pela minha família. Guarda cada um no Teu cuidado, atrai os seus corações para Ti e dá-nos sabedoria para nos amarmos bem.',
    breve: 'Guarda os meus filhos e a minha família no Teu cuidado.' },
  { id: 'lar', nome: 'Lar', objeto: 'o meu lar',
    intercessao: 'Consagro a Ti o meu lar. Que esta casa seja lugar de paz, verdade, perdão e da Tua presença — nas palavras, nas rotinas e nos silêncios.',
    breve: 'Que o meu lar seja lugar de paz e da Tua presença.' },
  { id: 'relacionamentos', nome: 'Relacionamentos', objeto: 'os meus relacionamentos',
    intercessao: 'Apresento a Ti os meus relacionamentos. Ensina-me a amar com verdade, a perdoar, a estabelecer limites saudáveis e a não querer controlar ninguém.',
    breve: 'Ensina-me a amar com verdade e a perdoar nos meus relacionamentos.' },
  { id: 'trabalho', nome: 'Trabalho e provisão', objeto: 'o meu trabalho e a minha provisão',
    intercessao: 'Entrego a Ti o meu trabalho e a minha provisão. Dá-me diligência, honestidade e sabedoria para administrar o que Tu confias às minhas mãos.',
    breve: 'Abençoa o trabalho das minhas mãos e dá-me sabedoria com a provisão.' },
  { id: 'igreja', nome: 'Igreja e comunidade', objeto: 'a minha igreja e a minha comunidade',
    intercessao: 'Intercedo pela minha igreja e pela minha comunidade. Protege a unidade, fortalece os que servem e faz de nós sal e luz onde vivemos.',
    breve: 'Protege a minha igreja e faz de nós luz onde vivemos.' },
];

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

export const getTema = (id: TemaId) => TEMAS.find((t) => t.id === id)!;
export const getAlvo = (id: AlvoId) => ALVOS.find((a) => a.id === id)!;

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

export function montarOracao(o: OpcoesOracao): Oracao {
  const tema = getTema(o.tema);
  const alvo = getAlvo(o.alvo);
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

/** Encerramento da intercessão: entrega, confiança, descanso e volta às responsabilidades. */
export const ENCERRAMENTO = {
  titulo: 'Encerramento da intercessão',
  referencias: ['Filipenses 4:6-7', 'Salmo 91:2', '1 Pedro 5:7'],
  texto:
    'Pai, entrego em Tuas mãos tudo o que apresentei agora. Não preciso carregar estas preocupações sozinha: Tu és o meu refúgio e a minha fortaleza. Confio na Tua proteção — não porque cumpri um ritual, mas porque Tu és fiel. Acalma o meu coração e dá-me descanso. Agora volto às minhas responsabilidades com paz, disposta a obedecer no que estiver ao meu alcance. Em nome de Jesus, amém.',
  atitude: 'Volte às suas tarefas com tranquilidade. Se algum pensamento voltar a pesar, entregue-o de novo em uma frase simples.',
};
