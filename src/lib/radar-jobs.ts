export type RadarJobRow = {
  id: number;
  titulo: string | null;
  Empresa: string | null;
  ubicacion: string | null;
  ciudad: string | null;
  fotoEmpresa: string | null;
  image: string | null;
  latLong: string | null;
};
export type RadarJob = RadarJobRow & { position: { lat: number; lng: number } };

export function parseJobCoordinates(value: string | null): RadarJob['position'] | null {
  if (!value?.trim()) return null;
  const match = value.trim().match(/^\(?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)?$/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

export function toRadarJobs(rows: RadarJobRow[]): RadarJob[] {
  const seen = new Set<number>();
  return rows.flatMap((row) => {
    const position = parseJobCoordinates(row.latLong);
    if (!position || seen.has(row.id)) return [];
    seen.add(row.id);
    return [{ ...row, position }];
  });
}