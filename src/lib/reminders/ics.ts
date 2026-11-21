import { PORTALS, formatHora, getPortal, nomePortal, type PortalId } from '@/lib/content/portals';
import type { Preferences } from '@/lib/store/schema';

export interface Lembrete { portal: PortalId; hora: string /* HH:MM */ }

export const horarioDe = (prefs: Pick<Preferences, 'horariosLembrete'>, id: PortalId) =>
  prefs.horariosLembrete[id] ?? formatHora(getPortal(id)!.hora);

export const lembretesDe = (prefs: Pick<Preferences, 'portaisAtivos' | 'horariosLembrete'>): Lembrete[] =>
  PORTALS.filter((p) => prefs.portaisAtivos.includes(p.id)).map((p) => ({ portal: p.id, hora: horarioDe(prefs, p.id) }));

/** Codifica a lista no endereço (só ids de portal e horários — nenhum dado pessoal). Ex.: alvorada.0600,silencio.2100 */
export const codificar = (l: Lembrete[]) => l.map((x) => `${x.portal}.${x.hora.replace(':', '')}`).join(',');

export function decodificar(q: string | null): Lembrete[] {
  if (!q) return [];
  const ids = new Set(PORTALS.map((p) => p.id as string));
  const out: Lembrete[] = [];
  for (const parte of q.split(',').slice(0, 8)) {
    const m = /^([a-z]+)\.([01]\d|2[0-3])([0-5]\d)$/.exec(parte.trim());
    if (m && ids.has(m[1]) && !out.some((x) => x.portal === m[1])) out.push({ portal: m[1] as PortalId, hora: `${m[2]}:${m[3]}` });
  }
  return out;
}

const esc = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
const dobrar = (linha: string) => (linha.length <= 74 ? linha : linha.match(/.{1,74}/g)!.join('\r\n '));

/**
 * Calendário com um evento diário por portal, com alarme na hora.
 * Horário "flutuante" (sem fuso): o celular usa o fuso local da usuária.
 */
export function gerarIcs(lembretes: Lembrete[], appUrl: string, hoje = new Date()): string {
  const d = `${hoje.getFullYear()}${String(hoje.getMonth() + 1).padStart(2, '0')}${String(hoje.getDate()).padStart(2, '0')}`;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const linhas = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Sentinelas da Estacao//PT-BR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:Sentinelas da Estação',
  ];
  for (const l of lembretes) {
    const p = getPortal(l.portal)!;
    const [h, m] = l.hora.split(':');
    const fimH = String((Number(h) + (Number(m) >= 45 ? 1 : 0)) % 24).padStart(2, '0');
    const fimM = String((Number(m) + 15) % 60).padStart(2, '0');
    linhas.push(
      'BEGIN:VEVENT',
      `UID:sentinelas-${p.id}@sentinelas-da-estacao`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${d}T${h}${m}00`,
      `DTEND:${d}T${fimH}${fimM}00`,
      'RRULE:FREQ=DAILY',
      `SUMMARY:${esc(`${nomePortal(p)} — ${p.proposito}`)}`,
      `DESCRIPTION:${esc(`Hora da vigília. Abra o app: ${appUrl}/vigilias/${p.id}/`)}`,
      `URL:${appUrl}/vigilias/${p.id}/`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(nomePortal(p))}`, 'TRIGGER:PT0M', 'END:VALARM',
      'END:VEVENT',
    );
  }
  linhas.push('END:VCALENDAR');
  return linhas.map(dobrar).join('\r\n') + '\r\n';
}
