import { describe, it, expect } from 'vitest';
import { Store, memoryStorage } from '@/lib/store/store';

const novo = () => { const s = memoryStorage(); return { s, store: new Store(s) }; };

describe('store local', () => {
  it('persiste e recarrega preferências', () => {
    const { s, store } = novo();
    store.setPreferences({ nome: 'Naiara', portaisAtivos: ['alvorada'], onboardingConcluido: true });
    const outra = new Store(s);
    expect(outra.getSnapshot().preferencias).toMatchObject({ nome: 'Naiara', portaisAtivos: ['alvorada'], onboardingConcluido: true });
  });

  it('dados corrompidos não quebram o app', () => {
    const store = new Store(memoryStorage('{isso não é json'));
    expect(store.getSnapshot().pedidos).toEqual([]);
  });

  it('trocar de estação preserva o histórico', () => {
    const { store } = novo();
    store.escolherEstacao('inverno', { motivos: 'espera' });
    store.escolherEstacao('primavera');
    const { estacoes } = store.getSnapshot();
    expect(estacoes).toHaveLength(2);
    expect(store.estacaoAtual?.estacao).toBe('primavera');
    expect(estacoes.find((e) => e.estacao === 'inverno')?.fim).toBeTruthy();
  });

  it('vigília: só uma em andamento, concluir registra fim', () => {
    const { store } = novo();
    const a = store.iniciarVigilia('alvorada');
    const b = store.iniciarVigilia('silencio');
    expect(b.id).toBe(a.id);
    store.atualizarVigilia(a.id, { oracaoPessoal: 'Senhor, consagro este dia.' });
    store.concluirVigilia(a.id);
    expect(store.vigiliaEmAndamento).toBeUndefined();
    expect(store.getSnapshot().vigilias[0]).toMatchObject({ oracaoPessoal: 'Senhor, consagro este dia.' });
  });

  it('pedido: valida título, recalibra sem perder o original e registra resposta', () => {
    const { store } = novo();
    expect(() => store.criarPedido({ titulo: '   ' })).toThrow();
    const p = store.criarPedido({ titulo: 'Sabedoria nas decisões', categoria: 'Trabalho' });
    store.recalibrar(p.id, { oQueMudou: 'a', oQuePermanece: 'b', novaNecessidade: 'c', atitude: 'd' });
    store.mudarStatus(p.id, 'Respondido', 'Deus abriu uma porta');
    const atual = store.getSnapshot().pedidos[0];
    expect(atual.titulo).toBe('Sabedoria nas decisões');
    expect(atual.historico.map((h) => h.tipo)).toEqual(['criado', 'recalibrado', 'status']);
    expect(atual.respondidoEm).toBeTruthy();
    expect(atual.testemunho).toBe('Deus abriu uma porta');
  });

  it('pedido prioritário só considera pedidos em aberto', () => {
    const { store } = novo();
    const a = store.criarPedido({ titulo: 'A', prioritario: true });
    store.criarPedido({ titulo: 'B' });
    expect(store.pedidoPrioritario?.titulo).toBe('A');
    store.mudarStatus(a.id, 'Encerrado');
    expect(store.pedidoPrioritario?.titulo).toBe('B');
  });

  it('diário: cria, edita, favorita, exclui', () => {
    const { store } = novo();
    const e = store.salvarRegistro({ titulo: 'Gratidão', tipo: 'Gratidão', texto: 'x' });
    store.salvarRegistro({ id: e.id, titulo: 'Gratidão de hoje' });
    store.favoritar(e.id);
    expect(store.getSnapshot().diario).toHaveLength(1);
    expect(store.getSnapshot().diario[0]).toMatchObject({ titulo: 'Gratidão de hoje', texto: 'x', favorito: true });
    store.excluirRegistro(e.id);
    expect(store.getSnapshot().diario).toHaveLength(0);
  });

  it('exportar e apagar todos os dados', () => {
    const { s, store } = novo();
    store.criarPedido({ titulo: 'Família' });
    expect(JSON.parse(store.exportar()).pedidos).toHaveLength(1);
    store.apagarTudo();
    expect(s.read()).toBeNull();
    expect(store.getSnapshot().pedidos).toEqual([]);
  });
});
