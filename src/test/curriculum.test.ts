import { describe, expect, it } from 'vitest';
import {
  curriculumPayload,
  emptyCurriculum,
  emptyEducation,
  emptyExperience,
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
    draft.fullName = 'María Pérez';
    draft.experiences[0] = { ...emptyExperience(), id: 'exp-1', puesto: 'Cajera', empresa: 'Tienda' };
    draft.experiences[1] = { ...emptyExperience(), id: 'blank-exp', puesto: ' ', empresa: '  ' };
    draft.education[0] = { ...emptyEducation(), id: 'edu-1', titulo: 'Bachillerato', institucion: 'Liceo 1' };
    const result = curriculumPayload(draft);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.experiences).toEqual([expect.objectContaining({ puesto: 'Cajera', empresa: 'Tienda', desde: '', hasta: '', descripcion: '' })]);
    expect(result.payload.education).toEqual([{ nivel: '', titulo: 'Bachillerato', institucion: 'Liceo 1', desde: '', hasta: '', descripcion: '', lugar: '', actualmente: false }]);
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

  it('builds full_name from first and last name and keeps personal fields', () => {
    const result = curriculumPayload({
      ...emptyCurriculum(),
      firstName: ' Dylan ',
      lastName: ' Sannino ',
      documentType: 'Cédula de identidad',
      documentNumber: '54263989',
      birthDate: '2001-07-28',
      gender: 'Hombre',
      phone: '91924104',
      phoneCountryCode: 'UY (+598)',
      extraPhone: '099 000 000',
      country: 'Uruguay',
      city: 'Montevideo',
      nationality: 'Uruguaya',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.full_name).toBe('Dylan Sannino');
    expect(result.payload.first_name).toBe('Dylan');
    expect(result.payload.last_name).toBe('Sannino');
    expect(result.payload.document_number).toBe('54263989');
    expect(result.payload.birth_date).toBe('2001-07-28');
    expect(result.payload.gender).toBe('Hombre');
    expect(result.payload.city).toBe('Montevideo');
    expect(result.payload.nationality).toBe('Uruguaya');
  });

  it('rejects a malformed birth date', () => {
    const result = curriculumPayload({ ...emptyCurriculum(), firstName: 'María', birthDate: '28/07/2001' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('fecha de nacimiento');
  });

  it('reads personal fields back from a stored row', () => {
    const draft = toCurriculumDraft({
      full_name: 'Dylan Sannino',
      first_name: 'Dylan',
      last_name: 'Sannino',
      document_type: 'Pasaporte',
      document_number: 'A123',
      birth_date: '2001-07-28',
      gender: 'Hombre',
      phone: '91924104',
      phone_country_code: 'UY (+598)',
      extra_phone: null,
      country: 'Uruguay',
      city: 'Montevideo',
      nationality: 'Uruguaya',
      summary: null,
      experiences: [],
      education: [],
      skills: [],
    });
    expect(draft.firstName).toBe('Dylan');
    expect(draft.lastName).toBe('Sannino');
    expect(draft.documentType).toBe('Pasaporte');
    expect(draft.birthDate).toBe('2001-07-28');
    expect(draft.gender).toBe('Hombre');
    expect(draft.city).toBe('Montevideo');
  });

  it('prefills the name from full_name on rows saved before the split', () => {
    const draft = toCurriculumDraft({
      full_name: 'María Pérez',
      phone: null,
      summary: null,
      experiences: [],
      education: [],
      skills: [],
    });
    expect(draft.firstName).toBe('María Pérez');
    expect(draft.lastName).toBe('');
    expect(draft.documentType).toBe('Cédula de identidad');
    expect(draft.country).toBe('Uruguay');
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
