/**
 * Minha Jornada — programa inicial de sete dias (temas definidos no método).
 * Exercícios, leituras e perguntas do capítulo “Plano de 7 Dias” do e-book; explicações de apoio editáveis pela autora.
 */
export interface DiaJornada {
  dia: number;
  titulo: string;
  explicacao: string;
  leitura: string;
  reflexao: string;
  exercicio: string;
  /** atalho para a parte do app onde o exercício acontece */
  acao?: { rotulo: string; href: string };
}

export const PROGRAMA_ID = 'sete-dias';
export const PROGRAMA_TITULO = 'Plano de Sete Dias';

export const JORNADA: DiaJornada[] = [
  {
    dia: 1,
    titulo: 'Palavra e identificação da estação',
    explicacao: 'Toda caminhada começa pela Palavra. Hoje você vai ler sobre os tempos de Deus e reconhecer, com honestidade, em que estação sua vida está.',
    leitura: 'Eclesiastes 3:1-8',
    reflexao: 'Minha estação: qual delas descreve meu momento, e por quê?',
    exercicio: 'Leia Eclesiastes 3:1-8. Registre o que o texto diz antes de aplicar. Depois escolha, apenas como metáfora devocional, a estação que mais descreve seu momento.',
    acao: { rotulo: 'Ir para Estações', href: '/estacoes/' },
  },
  {
    dia: 2,
    titulo: 'Organização do altar',
    explicacao: 'Um altar organizado ajuda a orar com constância. Hoje você vai colocar diante de Deus o que pesa no seu coração, com nome e categoria.',
    leitura: 'Filipenses 4:6',
    reflexao: 'Meus cinco pedidos prioritários.',
    exercicio: 'Liste até cinco pedidos prioritários. Organize por categoria e escolha um deles para apresentar com calma em dois portais diferentes.',
    acao: { rotulo: 'Ir para Meu Altar', href: '/altar/' },
  },
  {
    dia: 3,
    titulo: 'Escolha dos portais',
    explicacao: 'Os portais organizam a sua rotina de oração. Eles não têm poder em si mesmos: são encontros marcados com Deus ao longo do dia.',
    leitura: 'Colossenses 4:2',
    reflexao: 'Meus três portais.',
    exercicio: 'Escolha três horários possíveis para sua rotina. Você não precisa começar pelos oito.',
    acao: { rotulo: 'Ir para Vigílias', href: '/vigilias/' },
  },
  {
    dia: 4,
    titulo: 'Vigilância do coração',
    explicacao: 'A sentinela vigia a cidade; a primeira cidade a ser guardada é o próprio coração. Hoje é dia de observar o que tem entrado e saído dele.',
    leitura: 'Provérbios 4:23',
    reflexao: 'Área para vigiar: que palavras, reações ou distrações preciso observar?',
    exercicio: 'Observe palavras, reações e distrações. Registre uma área que precisa de correção e uma atitude de obediência.',
    acao: { rotulo: 'Ir para o Diário', href: '/diario/' },
  },
  {
    dia: 5,
    titulo: 'Recalibração de uma oração',
    explicacao: 'Orações também amadurecem. Recalibrar é olhar de novo para um pedido: o que mudou, o que permanece e qual passo prático você vai dar.',
    leitura: 'Tiago 1:5',
    reflexao: 'O que mudou em um pedido? O que permanece igual?',
    exercicio: 'Releia um pedido do altar. Ajuste a oração sem transformar circunstâncias em profecia. Use o botão Recalibrar.',
    acao: { rotulo: 'Ir para Meu Altar', href: '/altar/' },
  },
  {
    dia: 6,
    titulo: 'Silêncio e oração',
    explicacao: 'Nem toda oração precisa de muitas palavras. Hoje o convite é aquietar-se, orar em secreto e apenas permanecer.',
    leitura: 'Salmo 46:10',
    reflexao: 'O que acontece no meu coração quando eu fico em silêncio diante de Deus?',
    exercicio: 'Separe alguns minutos sem notificações. Leia um Salmo, ore com suas palavras e permaneça em silêncio diante de Deus.',
    acao: { rotulo: 'Ir ao Portal do Silêncio', href: '/vigilias/silencio/' },
  },
  {
    dia: 7,
    titulo: 'Revisão e continuidade',
    explicacao: 'A sentinela sobe à torre todos os dias. Hoje você revisa a semana e decide como vai continuar. O método existe para servir à comunhão com Deus, não para se tornar mais uma fonte de cobrança.',
    leitura: 'Marcos 2:27',
    reflexao: 'O que vou manter? O que vou simplificar? Pelo que agradeço nesta semana?',
    exercicio: 'Releia a semana. Observe o que funcionou e ajuste o que foi pesado demais. Escolha o que continuará na próxima semana.',
    acao: { rotulo: 'Ir para o Diário', href: '/diario/' },
  },
];
