import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import type { JobListItem } from "@/lib/job-list";
import type { SocialPostRow } from "@/lib/social-posts";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { RadarJobRow } from "@/lib/radar-jobs";

export type JobDetailData = {
  id: number;
  titulo: string | null;
  descripcion: string | null;
  empresa: string | null;
  inciso: string | null;
  unidadEjecutora: string | null;
  ubicacion: string | null;
  ciudad: string | null;
  jornada: string | null;
  tipoContrato: string | null;
  salario: number | null;
  fechaInicio: string | null;
  fechaCierre: string | null;
  cantidadCupos: number | null;
  requisitos: string[] | null;
  empleabilidad: string[] | null;
  fotoEmpresa: string | null;
  image: string | null;
  categoria: string | null;
  puesto: string | null;
  estadoPostulacion: string | null;
  isLlamado: boolean | null;
};

export const getJobById = createServerFn({ method: "GET" })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }): Promise<JobDetailData | null> => {
    const { data, error } = await supabase
      .from("JobsDetails")
      .select(
        "id, titulo, descripcion, Empresa, Inciso, UnidadEjecutora, ubicacion, ciudad, jornada, tipoContrato, salario, llamadoFechaInicio, llamadoFechaCierre, cantidadCupos, requisitos, empleabilidad, fotoEmpresa, image, categoria, puesto, estado_postulacion, isLlamado",
      )
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    return {
      id: data.id,
      titulo: data.titulo,
      descripcion: data.descripcion,
      empresa: data.Empresa,
      inciso: data.Inciso,
      unidadEjecutora: data.UnidadEjecutora,
      ubicacion: data.ubicacion,
      ciudad: data.ciudad,
      jornada: data.jornada,
      tipoContrato: data.tipoContrato,
      salario: data.salario,
      fechaInicio: data.llamadoFechaInicio,
      fechaCierre: data.llamadoFechaCierre,
      cantidadCupos: data.cantidadCupos,
      requisitos: data.requisitos,
      empleabilidad: data.empleabilidad,
      fotoEmpresa: data.fotoEmpresa,
      image: data.image,
      categoria: data.categoria,
      puesto: data.puesto,
      estadoPostulacion: data.estado_postulacion,
      isLlamado: data.isLlamado,
    };
  });

export const getLatestLlamadoId = createServerFn({ method: "GET" }).handler(
  async (): Promise<number | null> => {
    const { data, error } = await supabase
      .from("JobsDetails")
      .select("id")
      .eq("isLlamado", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data?.id ?? null;
  },
);

export const getJobsList = createServerFn({ method: "GET" }).handler(async (): Promise<JobListItem[]> => {
  // Only public employment fields; never return applicant data.
  const jobs: JobListItem[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase
      .from("JobsDetails")
      .select("id, titulo, descripcion, Empresa, ubicacion, ciudad, fotoEmpresa, image, created_at, isFeatured, estado_postulacion, tipoContrato")
      // Public home shows all offers and llamados; RLS restricts to display columns only.
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + 999);
    if (error) throw new Error("No pudimos cargar los empleos. Intentá nuevamente.");
    jobs.push(...(data ?? []));
    if (!data || data.length < 1000) return jobs;
  }
});

export const getSocialPosts = createServerFn({ method: "GET" }).handler(async (): Promise<SocialPostRow[]> => {
  // Poster and display fields only; never return applicant data.
  const rows: SocialPostRow[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase
      .from("JobsDetails")
      .select("id, poster, titulo, Empresa, ubicacion, ciudad, fotoEmpresa, image, created_at")
      .eq("isLlamado", false)
      .not("poster", "is", null)
      .neq("poster", "")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + 999);
    if (error) throw new Error("No pudimos cargar los pósteres. Intentá nuevamente.");
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) return rows;
  }
});

export const getRadarJobs = createServerFn({ method: "GET" }).handler(async (): Promise<RadarJobRow[]> => {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error('No pudimos conectar con las ofertas.');
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
      headers.set('apikey', key);
      return fetch(input, { ...init, headers });
    } },
  });
  const jobs: RadarJobRow[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.from('JobsDetails')
      .select('id, titulo, Empresa, ubicacion, ciudad, fotoEmpresa, image, latLong')
      .eq('isLlamado', false).not('latLong', 'is', null).neq('latLong', '')
      .order('id', { ascending: false }).range(offset, offset + 999);
    if (error) throw new Error('No pudimos cargar las ofertas del Radar.');
    jobs.push(...(data ?? []));
    if (!data || data.length < 1000) return jobs;
  }
});
