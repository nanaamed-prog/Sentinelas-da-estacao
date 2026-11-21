import { describe, it, expect } from 'vitest';
import { NAV, isActive } from '@/components/layout/BottomNavigation';

describe('menu inferior', () => {
  it('tem os cinco itens na ordem da especificação', () => {
    expect(NAV.map((n) => n.label)).toEqual(['Minha Torre', 'Vigílias', 'Estações', 'Meu Altar', 'Diário']);
  });
  it('marca a aba ativa corretamente', () => {
    expect(isActive('/', '/')).toBe(true);
    expect(isActive('/vigilias/alvorada/', '/vigilias/')).toBe(true);
    expect(isActive('/vigilias', '/')).toBe(false);
  });
});
