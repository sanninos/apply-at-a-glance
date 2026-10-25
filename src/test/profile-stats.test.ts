import { describe, expect, it } from 'vitest';
import { statCountLabel, summarizeCurriculum, summarizePostulaciones } from '../lib/profile-stats';

describe('profile stats', () => {
  it('sums postulaciones and breaks them down by estado, biggest first', () => {
    const summary = summarizePostulaciones([
      { estado: 'Enviada' },
      { estado: 'Entrevista' },
      { estado: 'Enviada' },
      { estado: 'No seleccionada' },
    ]);
    expect(summary.total).toBe(4);
    expect(summary.byEstado[0]).toEqual({ estado: 'Enviada', label: 'Enviada', tone: 'sent', count: 2 });
    expect(summary.byEstado.map((entry) => entry.count)).toEqual([2, 1, 1]);
  });

  it('handles an empty postulaciones list', () => {
    const summary = summarizePostulaciones([]);
    expect(summary.total).toBe(0);
    expect(summary.byEstado).toEqual([]);
  });

  it('counts curriculum contents from the stored row', () => {
    const summary = summarizeCurriculum({
      full_name: 'María',
      phone: null,
      summary: null,
      experiences: [{}, {}],
      education: [{}],
      skills: ['Caja'],
    });
    expect(summary).toEqual({ saved: true, experiences: 2, education: 1, skills: 1 });
  });

  it('reports a missing curriculum honestly', () => {
    expect(summarizeCurriculum(undefined)).toEqual({ saved: false, experiences: 0, education: 0, skills: 0 });
  });

  it('labels counts in singular or plural', () => {
    expect(statCountLabel(1, 'postulación', 'postulaciones')).toBe('1 postulación');
    expect(statCountLabel(0, 'oferta', 'ofertas')).toBe('0 ofertas');
    expect(statCountLabel(9, 'habilidad', 'habilidades')).toBe('9 habilidades');
  });
});
