import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { persistSavedOffer, savedOfferId, savedOfferInput } from './saved-offers';

export const setSavedOffer = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(savedOfferInput)
  .handler(({ data, context }) => persistSavedOffer(context.supabase, context.userId, data));

export const getSavedOffer = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(savedOfferId)
  .handler(async ({ data, context }) => {
    const result = await context.supabase.from('ofertas_guardadas').select('id')
      .eq('user_id', context.userId).eq('job_id', data.jobId).maybeSingle();
    if (result.error) throw new Error('No pudimos comprobar si guardaste esta oferta.');
    return { saved: Boolean(result.data) };
  });

export const getSavedOffers = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const fetchPage = (offset: number) => context.supabase.from('ofertas_guardadas')
      .select('id, job_id, created_at, JobsDetails(id, titulo, Empresa, ubicacion, ciudad, fotoEmpresa, image, isLlamado)')
      .eq('user_id', context.userId).order('created_at', { ascending: false }).order('id')
      .range(offset, offset + 999);
    const first = await fetchPage(0);
    if (first.error) throw new Error('No pudimos cargar tus ofertas guardadas.');
    const rows = [...(first.data ?? [])];
    let page = first.data ?? [];
    while (page.length === 1000) {
      const next = await fetchPage(rows.length);
      if (next.error) throw new Error('No pudimos cargar tus ofertas guardadas.');
      page = next.data ?? [];
      rows.push(...page);
    }
    return rows.filter(row => row.JobsDetails?.isLlamado === false);
  });