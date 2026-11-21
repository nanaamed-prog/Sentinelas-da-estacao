import { describe, it, expect } from 'vitest';
import { codificar, decodificar, gerarIcs, horarioDe, lembretesDe } from '@/lib/reminders/ics';
import { Store, memoryStorage } from '@/lib/store/store';

describe('lembretes', () => {
  const prefs = { portaisAtivos: ['alvorada', 'silencio'] as const, horariosLembrete: { silencio: '21:30' } };

  it('usa o horário do portal ou o horário escolhido', () => {
    expect(horarioDe(prefs as any, 'alvorada')).toBe('06:00');
    expect(horarioDe(prefs as any, 'silencio')).toBe('21:30');
  });

  it('o endereço leva só ids e horários e é validado', () => {
    const q = codificar(lembretesDe(prefs as any));
    expect(q).toBe('alvorada.0600,silencio.2130');
    expect(decodificar(q)).toEqual([{ portal: 'alvorada', hora: '06:00' }, { portal: 'silencio', hora: '21:30' }]);
    expect(decodificar('hackeado.0600,alvorada.2599,<script>.0000')).toEqual([]);
  });

  it('gera um calendário com evento diário e alarme por portal', () => {
    const ics = gerarIcs(decodificar('alvorada.0600,silencio.2150'), 'https://app.exemplo', new Date(2026, 10, 22));
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain('DTSTART:20261122T060000');
    expect(ics).toContain('DTEND:20261122T220500');
    expect(ics).toContain('RRULE:FREQ=DAILY');
    expect(ics).toContain('TRIGGER:PT0M');
    expect(ics).toContain('UID:sentinelas-alvorada@sentinelas-da-estacao');
    expect(ics.split('\r\n').every((l) => l.length <= 75)).toBe(true);
  });

  it('horários personalizados ficam salvos nas preferências', () => {
    const s = new Store(memoryStorage());
    s.setPreferences({ horariosLembrete: { alvorada: '05:45' } });
    expect(s.getSnapshot().preferencias.horariosLembrete.alvorada).toBe('05:45');
    expect(() => s.setPreferences({ horariosLembrete: { alvorada: '25:00' } as any })).toThrow();
  });
});
