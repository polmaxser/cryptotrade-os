'use client';

import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminPromoCodesQuery } from '@/hooks/use-admin-promo-codes-query';
import { setAdminPromoCodeActive } from '@/lib/api/admin';
import { QUERY_KEYS } from '@/lib/constants';
import { AdminPromoCodeDialog } from './admin-promo-code-dialog';

export function AdminPromoCodesTab() {
  const t = useTranslations('admin.promoCodes');
  const queryClient = useQueryClient();
  const promoCodesQuery = useAdminPromoCodesQuery();

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setAdminPromoCodeActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminPromoCodes });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AdminPromoCodeDialog>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            {t('newCode')}
          </Button>
        </AdminPromoCodeDialog>
      </div>

      {promoCodesQuery.isLoading ? (
        <div className="flex min-h-[20vh] items-center justify-center">
          <div className="border-muted-foreground/30 border-t-foreground h-8 w-8 animate-spin rounded-full border-2" />
        </div>
      ) : promoCodesQuery.isError ? (
        <p className="text-muted-foreground py-8 text-center text-sm">{t('loadError')}</p>
      ) : promoCodesQuery.data && promoCodesQuery.data.length > 0 ? (
        <div className="border-border/60 overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border/60 text-muted-foreground border-b text-left text-xs uppercase">
                <th className="px-4 py-3 font-medium">{t('columnCode')}</th>
                <th className="px-4 py-3 font-medium">{t('columnPlan')}</th>
                <th className="px-4 py-3 font-medium">{t('columnFreeDays')}</th>
                <th className="px-4 py-3 font-medium">{t('columnRedemptions')}</th>
                <th className="px-4 py-3 font-medium">{t('columnStatus')}</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {promoCodesQuery.data.map((promo) => (
                <tr key={promo.id} className="border-border/40 border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{promo.code}</div>
                    {promo.description ? (
                      <div className="text-muted-foreground text-xs">{promo.description}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{promo.grantsPlan}</td>
                  <td className="px-4 py-3">{promo.freeDays}</td>
                  <td className="px-4 py-3">
                    {promo.redemptionCount}
                    {promo.maxRedemptions ? ` / ${promo.maxRedemptions}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={promo.isActive ? 'success' : 'danger'}>
                      {promo.isActive ? t('active') : t('inactive')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={toggleMutation.isPending}
                      onClick={() =>
                        toggleMutation.mutate({ id: promo.id, isActive: !promo.isActive })
                      }
                    >
                      {promo.isActive ? t('deactivate') : t('activate')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-muted-foreground py-8 text-center text-sm">{t('empty')}</p>
      )}
    </div>
  );
}
