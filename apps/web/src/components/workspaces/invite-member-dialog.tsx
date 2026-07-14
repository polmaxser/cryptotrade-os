'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, UserPlus } from 'lucide-react';
import { getPathname } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { inviteMember } from '@/lib/api/workspaces';
import { ApiError } from '@/lib/api/errors';
import { QUERY_KEYS } from '@/lib/constants';
import { INVITABLE_ROLES, type WorkspaceRole } from '@/types/workspace';

type InviteMemberDialogProps = {
  workspaceId: string;
};

export function InviteMemberDialog({ workspaceId }: InviteMemberDialogProps) {
  const t = useTranslations('workspaces.invite');
  const tRoles = useTranslations('workspaces.roles');
  const tErrors = useTranslations('auth.errors');
  const queryClient = useQueryClient();
  const locale = useLocale();

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('MEMBER');
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: () => inviteMember(workspaceId, { email, role }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workspaceInvitations(workspaceId) });
      const path = getPathname({
        href: `/invitations/${result.token}`,
        locale,
      });
      setInviteLink(`${window.location.origin}${path}`);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : tErrors('generic')),
  });

  function resetAndClose() {
    setOpen(false);
    setEmail('');
    setRole('MEMBER');
    setError(null);
    setInviteLink(null);
    setCopied(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    mutation.mutate();
  }

  async function handleCopy() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetAndClose();
      }}
    >
      <Button size="sm" variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" />
        {t('trigger')}
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        {inviteLink ? (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">{t('linkGenerated')}</p>
            <div className="flex gap-2">
              <Input readOnly value={inviteLink} className="font-mono text-xs" />
              <Button type="button" size="icon" variant="outline" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">{t('linkNote')}</p>
            <DialogFooter>
              <Button type="button" onClick={resetAndClose}>
                {t('done')}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">{t('emailLabel')}</Label>
              <Input
                id="inviteEmail"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inviteRole">{t('roleLabel')}</Label>
              <select
                id="inviteRole"
                value={role}
                onChange={(event) => setRole(event.target.value as WorkspaceRole)}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                {INVITABLE_ROLES.map((invitableRole) => (
                  <option key={invitableRole} value={invitableRole}>
                    {tRoles(invitableRole)}
                  </option>
                ))}
              </select>
            </div>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? t('submitting') : t('submit')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
