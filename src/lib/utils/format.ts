/** UUID v4 (compatível com as chaves do banco). */
export const uid = (): string => {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  const b = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(b); else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

export function saudacao(d: Date): string {
  const h = d.getHours();
  if (h < 5) return 'Boa madrugada';
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export const dataLonga = (d: Date) =>
  d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

export const dataCurta = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

export function emQuanto(min: number): string {
  if (min < 60) return `em ${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `em ${h}h${String(m).padStart(2, '0')}` : `em ${h}h`;
}
