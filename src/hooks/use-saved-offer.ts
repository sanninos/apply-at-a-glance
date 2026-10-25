import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useAccess } from '@/components/access-provider';
import { useAccessDialog } from '@/components/access-dialog';
import { getSavedOffer, setSavedOffer } from '@/lib/saved-offers.functions';

export function useSavedOffer(jobId: number) {
  const { user, ready } = useAccess();
  const { open } = useAccessDialog();
  const queryClient = useQueryClient();
  const read = useServerFn(getSavedOffer);
  const write = useServerFn(setSavedOffer);
  const key = ['saved-offer', user?.id, jobId];
  const query = useQuery({ queryKey: key, enabled: ready && Boolean(user), queryFn: () => read({ data: { jobId } }) });
  const mutation = useMutation({
    mutationFn: (saved: boolean) => write({ data: { jobId, saved } }),
    onSuccess: result => {
      queryClient.setQueryData(key, result);
      void queryClient.invalidateQueries({ queryKey: ['saved-offers', user?.id] });
    },
  });
  return {
    saved: Boolean(user && query.data?.saved),
    busy: !ready || Boolean(user && query.isPending) || mutation.isPending,
    error: mutation.isError ? 'No pudimos actualizar tus ofertas guardadas. Intentá nuevamente.' : query.isError ? 'No pudimos comprobar tus guardados. Volvé a intentar.' : '',
    toggle: () => {
      if (!user) { open(); return; }
      if (query.isError) { void query.refetch(); return; }
      if (!query.isPending && !mutation.isPending) mutation.mutate(!query.data?.saved);
    },
  };
}