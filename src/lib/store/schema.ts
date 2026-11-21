import { z } from 'zod';

const iso = z.string().min(1);
export const seasonId = z.enum(['primavera', 'verao', 'outono', 'inverno']);
export const portalId = z.enum(['imersao', 'guerra', 'alvorada', 'colheita', 'santidade', 'sabedoria', 'ocaso', 'silencio']);

export const CATEGORIAS = ['Família', 'Filhos', 'Casamento e relacionamentos', 'Saúde', 'Trabalho', 'Finanças', 'Igreja', 'Vida espiritual', 'Outros'] as const;
export const STATUS = ['Em oração', 'Em acompanhamento', 'Respondido', 'Encerrado'] as const;
export const TIPOS_DIARIO = ['Palavra', 'Oração', 'Discernimento', 'Gratidão', 'Testemunho', 'Reflexão livre', 'Fechamento do dia'] as const;

export const preferencesSchema = z.object({
  nome: z.string().max(60).default(''),
  onboardingConcluido: z.boolean().default(false),
  tema: z.enum(['noite', 'pergaminho']).default('noite'),
  portaisAtivos: z.array(portalId).default([]),
  lembretes: z.boolean().default(false),
});

export const seasonRecordSchema = z.object({
  id: z.string(),
  estacao: seasonId,
  inicio: iso,
  fim: iso.optional(),
  motivos: z.string().max(4000).default(''),
  reflexao: z.string().max(8000).default(''),
  desafios: z.string().max(4000).default(''),
  atitudes: z.string().max(4000).default(''),
  criadoEm: iso,
  atualizadoEm: iso,
});

export const requestUpdateSchema = z.object({
  id: z.string(),
  em: iso,
  tipo: z.enum(['criado', 'status', 'recalibrado', 'nota']),
  oQueMudou: z.string().max(4000).optional(),
  oQuePermanece: z.string().max(4000).optional(),
  novaNecessidade: z.string().max(4000).optional(),
  atitude: z.string().max(4000).optional(),
  status: z.enum(STATUS).optional(),
});

export const prayerRequestSchema = z.object({
  id: z.string(),
  titulo: z.string().trim().min(1, 'Dê um título ao pedido').max(120),
  descricao: z.string().max(4000).default(''),
  categoria: z.enum(CATEGORIAS).default('Outros'),
  pessoaOuAssunto: z.string().max(120).default(''),
  portal: portalId.optional(),
  estacao: seasonId.optional(),
  prioritario: z.boolean().default(false),
  status: z.enum(STATUS).default('Em oração'),
  respondidoEm: iso.optional(),
  testemunho: z.string().max(8000).optional(),
  historico: z.array(requestUpdateSchema).default([]),
  criadoEm: iso,
  atualizadoEm: iso,
});

export const prayerSessionSchema = z.object({
  id: z.string(),
  portal: portalId,
  inicio: iso,
  fim: iso.optional(),
  oracaoPessoal: z.string().max(8000).default(''),
  pedidos: z.array(z.string()).default([]),
});

export const journalEntrySchema = z.object({
  id: z.string(),
  data: iso,
  tipo: z.enum(TIPOS_DIARIO).default('Reflexão livre'),
  titulo: z.string().trim().min(1, 'Dê um título ao registro').max(140),
  texto: z.string().max(20000).default(''),
  referencia: z.string().max(80).default(''),
  estacao: seasonId.optional(),
  portal: portalId.optional(),
  marcadores: z.array(z.string().max(30)).default([]),
  favorito: z.boolean().default(false),
  criadoEm: iso,
  atualizadoEm: iso,
});

export const jornadaDiaSchema = z.object({
  dia: z.number().int().min(1).max(60),
  registro: z.string().max(8000).default(''),
  concluidoEm: iso.optional(),
});

/** Cada reinício cria um novo ciclo; os anteriores ficam no histórico. */
export const jornadaCicloSchema = z.object({
  ciclo: z.number().int().min(1),
  iniciadoEm: iso,
  dias: z.array(jornadaDiaSchema).default([]),
});

export const dbSchema = z.object({
  versao: z.literal(1),
  preferencias: preferencesSchema,
  estacoes: z.array(seasonRecordSchema),
  pedidos: z.array(prayerRequestSchema),
  vigilias: z.array(prayerSessionSchema),
  diario: z.array(journalEntrySchema),
  jornada: z.array(jornadaCicloSchema).default([]),
});

export type Preferences = z.infer<typeof preferencesSchema>;
export type SeasonRecord = z.infer<typeof seasonRecordSchema>;
export type PrayerRequest = z.infer<typeof prayerRequestSchema>;
export type RequestUpdate = z.infer<typeof requestUpdateSchema>;
export type PrayerSession = z.infer<typeof prayerSessionSchema>;
export type JournalEntry = z.infer<typeof journalEntrySchema>;
export type DB = z.infer<typeof dbSchema>;
export type JornadaCiclo = z.infer<typeof jornadaCicloSchema>;
export type JornadaDia = z.infer<typeof jornadaDiaSchema>;
export type Categoria = (typeof CATEGORIAS)[number];
export type Status = (typeof STATUS)[number];
export type TipoDiario = (typeof TIPOS_DIARIO)[number];

export const emptyDB = (): DB => ({
  versao: 1,
  preferencias: preferencesSchema.parse({}),
  estacoes: [],
  pedidos: [],
  vigilias: [],
  diario: [],
  jornada: [],
});
