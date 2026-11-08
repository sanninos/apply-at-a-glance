import { describe, expect, it } from 'vitest';
import { curriculumProgress, emptyCurriculum, emptyEducation, emptyExperience } from '../lib/curriculum';

describe('curriculumProgress', () => {
  it('is 0% for an empty curriculum and asks for the name first', () => {
    expect(curriculumProgress(emptyCurriculum())).toEqual({ percent: 0, next: 'Completá tu nombre' });
  });
  it('asks for the first experience once Sobre ti is complete', () => {
    const d = { ...emptyCurriculum(), fullName: 'Ana', phone: '099', birthDate: '2000-01-01', city: 'Montevideo', summary: 'Hola' };
    expect(curriculumProgress(d)).toEqual({ percent: 33, next: 'Agregá tu primera experiencia' });
  });
  it('is 100% with Sobre ti, an experience and an education', () => {
    const d = { ...emptyCurriculum(), fullName: 'Ana', phone: '099', birthDate: '2000-01-01', city: 'Montevideo', summary: 'Hola',
      experiences: [{ ...emptyExperience(), puesto: 'Cajera' }], education: [{ ...emptyEducation(), titulo: 'Bachillerato' }] };
    expect(curriculumProgress(d)).toEqual({ percent: 100, next: null });
  });
});
