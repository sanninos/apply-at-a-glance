import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

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
      .eq("isLlamado", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data?.id ?? null;
  },
);
