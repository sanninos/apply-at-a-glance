import { describe, expect, it } from 'vitest';
import {
  curriculumPayload,
  emptyCurriculum,
  toCurriculumDraft,
  type CurriculumRow,
} from '../lib/curriculum';

describe('curriculum editor', () => {
  it('requires a name before saving', () => {
    const draft = emptyCurriculum();
    const result = curriculumPayload(draft);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('nombre');
  });

  it('saves a filled draft with trimmed values', () => {
    const draft = emptyCurriculum();
    const result = curriculumPayload({
      ...draft,
      fullName: '  María Pérez ',
      phone: '099 123 456',
      summary: ' Atención al cliente ',
      skills: ' Caja , Excel ,  ',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.full_name).toBe('María Pérez');
    expect(result.payload.phone).toBe('099 123 456');
    expect(result.payload.summary).toBe('Atención al cliente');
    expect(result.payload.skills).toEqual(['Caja', 'Excel']);
    expect(result.payload.experiences).toEqual([]);
    expect(result.payload.education).toEqual([]);
  });

  it('drops blank experience and education rows', () => {
    const draft = emptyCurriculum();
    draft.experiences[0] = { ...draft.experiences[0], puesto: 'Cajera', empresa: 'Tienda' };
    draft.experiences[1] = { ...draft.experiences[1], puesto: ' ', empresa: '  ' };
    draft.education[0] = { ...draft.education[0], titulo: 'Bachillerato', institucion: 'Liceo 1' };
    const result = curriculumPayload(draft);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.experiences).toEqual([{ puesto: 'Cajera', empresa: 'Tienda', desde: '', hasta: '', descripcion: '' }]);
    expect(result.payload.education).toEqual([{ titulo: 'Bachillerato', institucion: 'Liceo 1', desde: '', hasta: '' }]);
  });

  it('reads a stored row back into an editable draft', () => {
    const row: CurriculumRow = {
      full_name: 'María Pérez',
      phone: '099 123 456',
      summary: 'Atención al cliente',
      experiences: [{ puesto: 'Cajera', empresa: 'Tienda', desde: '2022', hasta: 'Actualidad', descripcion: 'Cobro y stock.' }],
      education: [{ titulo: 'Bachillerato', institucion: 'Liceo 1', desde: '2018', hasta: '2021' }],
      skills: ['Caja', 'Excel'],
    };
    const draft = toCurriculumDraft(row);
    expect(draft.fullName).toBe('María Pérez');
    expect(draft.experiences[0]?.puesto).toBe('Cajera');
    expect(draft.education[0]?.titulo).toBe('Bachillerato');
    expect(draft.skills).toBe('Caja, Excel');
    // Trailing blank rows stay available for new entries.
    const last = draft.experiences[draft.experiences.length - 1];
    expect(last && last.puesto === '' && last.empresa === '').toBe(true);
  });

  it('tolerates malformed stored jsonb', () => {
    const draft = toCurriculumDraft({
      full_name: null,
      phone: null,
      summary: null,
      experiences: 'not-an-array',
      education: [null],
      skills: { bad: true },
    });
    expect(draft.fullName).toBe('');
    expect(draft.skills).toBe('');
    expect(draft.experiences.every((entry) => entry.puesto === '')).toBe(true);
  });
});
