import { describe, expect, it } from 'vitest';
import { applicationCountLabel, applicationStatus, applicationTimeline, listApplications, type ApplicationRow } from '../lib/applications';

const job = (id: number, extra: Partial<ApplicationRow['JobsDetails'] & object> = {}) => ({
  id,
  titulo: 'Cajera',
  Empresa: 'Tienda',
  ubicacion: 'Montevideo',
  ciudad: 'Montevideo',
  fotoEmpresa: null,
  image: null,
  tipoContrato: 'Permanente',
  estado_postulacion: 'Normal',
  isLlamado: false,
  ...extra,
});

const row = (id: string, jobId: number, appliedAt: string, extra: Partial<ApplicationRow> = {}): ApplicationRow => ({
  id,
  estado: 'Enviada',
  created_at: appliedAt,
  job_id: jobId,
  JobsDetails: job(jobId),
  ...extra,
});

describe('mis postulaciones list', () => {
  it('sorts the newest application first', () => {
    const items = listApplications([row('a', 1, '2026-10-01T10:00:00Z'), row('b', 2, '2026-10-20T10:00:00Z')]);
    expect(items.map((item) => item.jobId)).toEqual([2, 1]);
  });

  it('hides rows whose offer was removed', () => {
    expect(listApplications([row('a', 1, '2026-10-01T10:00:00Z', { JobsDetails: null })])).toEqual([]);
  });

  it('hides rows that are llamados, not offers', () => {
    expect(listApplications([row('a', 1, '2026-10-01T10:00:00Z', { JobsDetails: job(1, { isLlamado: true }) })])).toEqual([]);
  });

  it('keeps a single card per offer', () => {
    const items = listApplications([row('a', 7, '2026-10-01T10:00:00Z'), row('b', 7, '2026-10-05T10:00:00Z')]);
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe('b');
  });

  it('shows the stored status with the accent tone', () => {
    expect(applicationStatus('Entrevista')).toEqual({ label: 'Entrevista', tone: 'interview' });
    expect(applicationStatus('No seleccionada')).toEqual({ label: 'No seleccionada', tone: 'rejected' });
  });

  it('counts applications in singular or plural', () => {
    expect(applicationCountLabel(1)).toBe('1 postulación');
    expect(applicationCountLabel(0)).toBe('0 postulaciones');
    expect(applicationCountLabel(3)).toBe('3 postulaciones');
  });
});

describe('applicationTimeline', () => {
  const base = { id: 'a1', jobId: 1, appliedAt: '2026-11-01T10:00:00Z', job: { id: 1, titulo: 'Cajera', Empresa: 'Tienda', ubicacion: null, ciudad: null, fotoEmpresa: null, image: null, tipoContrato: null, estado_postulacion: null, isLlamado: false } };

  it('marks only the sent step as current for a fresh application', () => {
    const steps = applicationTimeline({ ...base, estado: 'Enviada' });
    expect(steps.map((s) => s.state)).toEqual(['current', 'upcoming', 'upcoming', 'upcoming']);
    expect(steps[0]?.date).toBe(base.appliedAt);
    expect(steps[1]?.date).toBeNull();
  });

  it('advances the current step with the stored estado', () => {
    expect(applicationTimeline({ ...base, estado: 'En revision' }).map((s) => s.state)).toEqual(['done', 'current', 'upcoming', 'upcoming']);
    expect(applicationTimeline({ ...base, estado: 'Entrevista' }).map((s) => s.state)).toEqual(['done', 'done', 'current', 'upcoming']);
  });

  it('ends rejected or selected at the result step', () => {
    const rejected = applicationTimeline({ ...base, estado: 'No seleccionada' });
    expect(rejected[3]?.state).toBe('rejected');
    expect(rejected[3]?.label).toBe('No seleccionada');
    const selected = applicationTimeline({ ...base, estado: 'Seleccionada' });
    expect(selected[3]?.state).toBe('done');
    expect(selected[3]?.label).toBe('Seleccionada');
  });
});
