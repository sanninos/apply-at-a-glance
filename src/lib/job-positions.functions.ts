import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { normalizePositionName, type JobPosition } from "@/lib/job-positions";

/** Public read-only client: RLS applies, so only display columns are reachable. */
function publicClient() {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error("No pudimos cargar los puestos.");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
      headers.set('apikey', key);
      return fetch(input, { ...init, headers });
    } },
  });
}

export const getJobPositions = createServerFn({ method: "GET" }).handler(async (): Promise<JobPosition[]> => {
  const client = publicClient();
  const positions: JobPosition[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.from("Puesto").select("id, nombre, icon")
      .order("nombre").order("id").range(offset, offset + 999);
    if (error) throw new Error("No pudimos cargar los puestos. Intentá nuevamente.");
    positions.push(...(data ?? []));
    if (!data || data.length < 1000) return positions;
  }
});

/** Offers per position name, keyed by the canonical name; counts only publicly visible offers. */
export const getJobPositionCounts = createServerFn({ method: "GET" }).handler(async (): Promise<Record<string, number>> => {
  const client = publicClient();
  const counts: Record<string, number> = {};
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.from("JobsDetails").select("puesto").range(offset, offset + 999);
    if (error) throw new Error("No pudimos cargar la cantidad de empleos. Intentá nuevamente.");
    for (const row of data ?? []) {
      const key = normalizePositionName(row.puesto);
      if (key) counts[key] = (counts[key] ?? 0) + 1;
    }
    if (!data || data.length < 1000) return counts;
  }
});
