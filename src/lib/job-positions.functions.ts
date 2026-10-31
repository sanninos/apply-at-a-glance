import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { JobPosition } from "@/lib/job-positions";

export const getJobPositions = createServerFn({ method: "GET" }).handler(async (): Promise<JobPosition[]> => {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error("No pudimos cargar los puestos.");
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
      headers.set('apikey', key);
      return fetch(input, { ...init, headers });
    } },
  });
  const positions: JobPosition[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.from("Puesto").select("id, nombre, icon")
      .order("nombre").order("id").range(offset, offset + 999);
    if (error) throw new Error("No pudimos cargar los puestos. Intentá nuevamente.");
    positions.push(...(data ?? []));
    if (!data || data.length < 1000) return positions;
  }
});