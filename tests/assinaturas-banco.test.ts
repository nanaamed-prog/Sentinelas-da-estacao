import { describe, it, expect, beforeAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { novoBanco, como } from './sql/banco';

const ANA = '11111111-1111-4111-8111-111111111111';
const BIA = '22222222-2222-4222-8222-222222222222';
const futuro = (dias: number) => new Date(Date.now() + dias * 86_400_000).toISOString();
let db: PGlite;

const novoRegistro = (uid: string, id: string, titulo = 'Registro') =>
  como(db, uid, `insert into public.journal_entries (id, user_id, titulo) values ($1, $2, $3)
    on conflict (id) do update set titulo = excluded.titulo`, [id, uid, titulo]);
const acesso = async (uid: string | null) => (await como<{ v: boolean }>(db, uid, 'select public.acesso_completo() as v')).rows[0].v;
const gravar = async (a: Record<string, unknown>) => {
  await db.exec('set role service_role;');
  try { return (await db.query<{ n: number }>('select public.gravar_assinatura($1::jsonb) as n', [JSON.stringify(a)])).rows[0].n; }
  finally { await db.exec('reset role;'); }
};
const ligar = (v: boolean) => db.query(`update public.app_config set valor = '${v}'::jsonb where chave = 'assinaturas_ativas'`);

beforeAll(async () => {
  db = await novoBanco();
  await db.query('insert into auth.users (id, email) values ($1, $2), ($3, $4)', [ANA, 'ana@ex.com', BIA, 'bia@ex.com']);
}, 60_000);

describe('assinaturas no banco (RLS e regras)', () => {
  it('planos iniciais configuráveis: R$ 19,90/mês e R$ 197,00/ano', async () => {
    const r = await como<{ id: string; valor_centavos: number; periodicidade: string }>(db, null, 'select id, valor_centavos, periodicidade from public.planos order by id');
    expect(r.rows).toEqual([{ id: 'anual', valor_centavos: 19700, periodicidade: 'ano' }, { id: 'mensal', valor_centavos: 1990, periodicidade: 'mes' }]);
  });

  it('com as assinaturas desligadas, tudo segue liberado (como antes)', async () => {
    expect(await acesso(ANA)).toBe(true);
    expect(await acesso(null)).toBe(true);
    await novoRegistro(ANA, 'aaaaaaaa-0000-4000-8000-000000000001');
  });

  it('ligadas: sem assinatura, não cria registro novo, mas lê, edita, exporta e apaga os antigos', async () => {
    await ligar(true);
    expect(await acesso(ANA)).toBe(false);
    await expect(novoRegistro(ANA, 'aaaaaaaa-0000-4000-8000-000000000002')).rejects.toThrow(/row-level security/);
    await novoRegistro(ANA, 'aaaaaaaa-0000-4000-8000-000000000001', 'Editado');
    const r = await como<{ titulo: string }>(db, ANA, 'select titulo from public.journal_entries');
    expect(r.rows).toEqual([{ titulo: 'Editado' }]);
    await expect(como(db, ANA, `insert into public.prayer_requests (user_id, titulo) values ($1, 'x')`, [ANA])).rejects.toThrow(/row-level security/);
  });

  it('a usuária não grava a própria assinatura nem consulta a de outra pessoa', async () => {
    await expect(como(db, ANA, `insert into public.assinaturas (user_id, provedor, status) values ($1, 'cortesia', 'ativa')`, [ANA])).rejects.toThrow();
    await expect(como(db, ANA, 'select public.tem_acesso_completo($1)', [BIA])).rejects.toThrow(/permission denied/);
    await expect(como(db, ANA, `select public.gravar_assinatura('{}'::jsonb)`)).rejects.toThrow(/permission denied/);
  });

  it('assinatura confirmada pelo provedor libera o acesso; só a própria é visível', async () => {
    const n = await gravar({ user_id: ANA, provedor_assinatura_id: 'sub_1', plano_id: 'mensal', status: 'ativa', periodo_fim: futuro(30), lido_em: '2026-11-22T10:00:00Z' });
    expect(n).toBe(1);
    expect(await acesso(ANA)).toBe(true);
    expect(await acesso(BIA)).toBe(false);
    await novoRegistro(ANA, 'aaaaaaaa-0000-4000-8000-000000000003');
    expect((await como(db, BIA, 'select * from public.assinaturas')).rows).toHaveLength(0);
  });

  it('evento fora de ordem não sobrescreve um estado mais novo', async () => {
    await gravar({ user_id: ANA, provedor_assinatura_id: 'sub_1', status: 'cancelada', periodo_fim: futuro(-5), lido_em: '2026-11-22T09:00:00Z' });
    expect(await acesso(ANA)).toBe(true);
    const r = await db.query<{ status: string; plano_id: string }>(`select status, plano_id from public.assinaturas where provedor_assinatura_id = 'sub_1'`);
    expect(r.rows[0]).toEqual({ status: 'ativa', plano_id: 'mensal' });
  });

  it('uma assinatura não muda de dona', async () => {
    await gravar({ user_id: BIA, provedor_assinatura_id: 'sub_1', status: 'ativa', periodo_fim: futuro(30), lido_em: '2026-11-22T11:00:00Z' });
    expect(await acesso(BIA)).toBe(false);
  });

  it('falha de pagamento mantém o acesso durante as novas tentativas; período vencido encerra', async () => {
    await gravar({ user_id: ANA, provedor_assinatura_id: 'sub_1', status: 'em_atraso', periodo_fim: futuro(2), lido_em: '2026-11-22T12:00:00Z' });
    expect(await acesso(ANA)).toBe(true);
    await gravar({ user_id: ANA, provedor_assinatura_id: 'sub_1', status: 'ativa', periodo_fim: futuro(-2), lido_em: '2026-11-22T13:00:00Z' });
    expect(await acesso(ANA)).toBe(false);
  });

  it('cancelamento ao fim do período: acesso até a data; depois, encerrada', async () => {
    await gravar({ user_id: ANA, provedor_assinatura_id: 'sub_1', status: 'ativa', cancelar_no_fim: true, periodo_fim: futuro(10), lido_em: '2026-11-22T14:00:00Z' });
    expect(await acesso(ANA)).toBe(true);
    await gravar({ user_id: ANA, provedor_assinatura_id: 'sub_1', status: 'cancelada', periodo_fim: futuro(-0.01), lido_em: '2026-11-22T15:00:00Z' });
    expect(await acesso(ANA)).toBe(false);
  });

  it('contestação aberta suspende o acesso', async () => {
    await gravar({ user_id: ANA, provedor_assinatura_id: 'sub_2', status: 'ativa', periodo_fim: futuro(30), lido_em: '2026-11-22T16:00:00Z' });
    expect(await acesso(ANA)).toBe(true);
    await db.query(`insert into public.clientes_pagamento (user_id, provedor_cliente_id, contestacao_aberta) values ($1, 'cus_1', true)`, [ANA]);
    expect(await acesso(ANA)).toBe(false);
    await db.query(`update public.clientes_pagamento set contestacao_aberta = false where user_id = $1`, [ANA]);
    expect(await acesso(ANA)).toBe(true);
  });

  it('duas assinaturas vigentes são sinalizadas para revisão', async () => {
    const n = await gravar({ user_id: ANA, provedor_assinatura_id: 'sub_3', status: 'ativa', periodo_fim: futuro(30), lido_em: '2026-11-22T16:00:00Z' });
    expect(n).toBe(2);
    const r = await db.query<{ observacao: string }>(`select observacao from public.assinaturas where provedor_assinatura_id in ('sub_2','sub_3')`);
    expect(r.rows.every((x) => /duplicidade/.test(x.observacao))).toBe(true);
  });

  it('não exclui a conta com assinatura renovando', async () => {
    await expect(como(db, ANA, 'select public.excluir_minha_conta()')).rejects.toThrow(/assinatura_renovando/);
  });

  it('eventos: idempotentes; reprocessa apenas o que falhou', async () => {
    await db.exec('set role service_role;');
    const reg = async () => (await db.query<{ v: boolean }>(`select public.registrar_evento('evt_1', 'invoice.paid', now()) as v`)).rows[0].v;
    expect(await reg()).toBe(true);
    await db.query(`select public.concluir_evento('evt_1', 'falhou')`);
    expect(await reg()).toBe(true);
    await db.query(`select public.concluir_evento('evt_1', null)`);
    expect(await reg()).toBe(false);
    await db.exec('reset role;');
  });

  it('cortesia concedida pela autora libera o acesso', async () => {
    await db.query(`insert into public.assinaturas (user_id, provedor, status, observacao) values ($1, 'cortesia', 'ativa', 'teste')`, [BIA]);
    expect(await acesso(BIA)).toBe(true);
  });
});
