import { describe, expect, it } from 'vitest';
import { applicationCountLabel, applicationStatus, listApplications, type ApplicationRow } from '../lib/applications';

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
