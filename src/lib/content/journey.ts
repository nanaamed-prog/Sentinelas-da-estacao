/**
 * Minha Jornada — programa inicial de sete dias (temas definidos no método).
 * Leituras: apenas a referência (abra na sua Bíblia). Textos editáveis pela autora.
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
    reflexao: 'Que palavras deste texto descrevem o momento que estou vivendo? O que este tempo está me pedindo?',
    exercicio: 'Escolha sua estação predominante e escreva os motivos da escolha.',
    acao: { rotulo: 'Ir para Estações', href: '/estacoes/' },
  },
  {
    dia: 2,
    titulo: 'Organização do altar',
    explicacao: 'Um altar organizado ajuda a orar com constância. Hoje você vai colocar diante de Deus o que pesa no seu coração, com nome e categoria.',
    leitura: 'Filipenses 4:6-7',
    reflexao: 'Quais preocupações eu tenho carregado sozinha? Quais delas ainda não transformei em oração?',
    exercicio: 'Registre ao menos três pedidos no seu altar e marque um como prioritário.',
    acao: { rotulo: 'Ir para Meu Altar', href: '/altar/' },
  },
  {
    dia: 3,
    titulo: 'Escolha dos portais',
    explicacao: 'Os portais organizam a sua rotina de oração. Eles não têm poder em si mesmos: são encontros marcados com Deus ao longo do dia.',
    leitura: 'Salmos 55:16-17',
    reflexao: 'Em quais momentos do meu dia eu consigo, de verdade, parar para orar?',
    exercicio: 'Escolha de um a três portais possíveis para esta semana e faça uma vigília em um deles.',
    acao: { rotulo: 'Ir para Vigílias', href: '/vigilias/' },
  },
  {
    dia: 4,
    titulo: 'Vigilância do coração',
    explicacao: 'A sentinela vigia a cidade; a primeira cidade a ser guardada é o próprio coração. Hoje é dia de observar o que tem entrado e saído dele.',
    leitura: 'Provérbios 4:23',
    reflexao: 'O que tem ocupado meus pensamentos? Que sentimentos preciso entregar antes que criem raiz?',
    exercicio: 'Faça um registro de Discernimento no diário usando o modelo de escrita orientada.',
    acao: { rotulo: 'Ir para o Diário', href: '/diario/' },
  },
  {
    dia: 5,
    titulo: 'Recalibração de uma oração',
    explicacao: 'Orações também amadurecem. Recalibrar é olhar de novo para um pedido: o que mudou, o que permanece e qual passo prático você vai dar.',
    leitura: 'Salmos 139:23-24',
    reflexao: 'Existe algum pedido que eu repito do mesmo jeito há muito tempo? O que Deus pode estar me mostrando nele?',
    exercicio: 'Abra um pedido do altar e use o botão Recalibrar.',
    acao: { rotulo: 'Ir para Meu Altar', href: '/altar/' },
  },
  {
    dia: 6,
    titulo: 'Silêncio e oração',
    explicacao: 'Nem toda oração precisa de muitas palavras. Hoje o convite é aquietar-se, orar em secreto e apenas permanecer.',
    leitura: 'Salmos 46:10 e Mateus 6:6',
    reflexao: 'O que acontece no meu coração quando eu fico em silêncio diante de Deus?',
    exercicio: 'Faça a vigília do Portal do Silêncio (21h) e registre como foi.',
    acao: { rotulo: 'Ir ao Portal do Silêncio', href: '/vigilias/silencio/' },
  },
  {
    dia: 7,
    titulo: 'Revisão e continuidade',
    explicacao: 'A sentinela sobe à torre todos os dias. Hoje você revisa a semana e decide como vai continuar, sem cobrança e com fidelidade.',
    leitura: 'Habacuque 2:1-3',
    reflexao: 'O que Deus me ensinou nesta semana? O que vou manter na próxima?',
    exercicio: 'Escreva um Fechamento do dia sobre a semana e revise sua estação.',
    acao: { rotulo: 'Ir para o Diário', href: '/diario/' },
  },
];
