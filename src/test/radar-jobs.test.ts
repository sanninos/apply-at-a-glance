import { describe, expect, it } from 'vitest';
import { parseJobCoordinates, toRadarJobs, type RadarJobRow } from '@/lib/radar-jobs';

describe('Radar coordinates', () => {
  it('preserves stored latitude and longitude in their correct order', () => {
    expect(parseJobCoordinates('-34.87125967417539, -56.19383044418038')).toEqual({ lat: -34.87125967417539, lng: -56.19383044418038 });
  });
  it('only includes offers with usable latLong information', () => {
    const row: RadarJobRow = { id: 111, titulo: 'Empleo', Empresa: null, ubicacion: null, ciudad: null, fotoEmpresa: null, image: null, latLong: '-34.87, -56.19' };
    const rows = [row, ...[null, '', '  ', 'texto', '91, 0', '0, 181'].map((latLong, index) => ({ ...row, id: index + 200, latLong }))];
    expect(toRadarJobs(rows).map((job) => job.id)).toEqual([111]);
  });
});