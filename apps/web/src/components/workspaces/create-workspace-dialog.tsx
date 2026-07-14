'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createWorkspace } from '@/lib/api/workspaces';
import { ApiError } from '@/lib/api/errors';
import { QUERY_KEYS } from '@/lib/constants';

export function CreateWorkspaceDialog() {
  const t = useTranslations('workspaces.create');
  const tErrors = useTranslations('auth.errors');
  const router = useRouter();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createWorkspace,
    onSuccess: (workspace) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workspaces });
      setOpen(false);
      setName('');
      setDescription('');
      router.push(`/workspaces/${workspace.id}`);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : tErrors('generic')),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    mutation.mutate({ name, description: description.trim() || undefined });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          {t('trigger')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspaceName">{t('nameLabel')}</Label>
            <Input
              id="workspaceName"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspaceDescription">{t('descriptionLabel')}</Label>
            <Textarea
              id="workspaceDescription"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('submitting') : t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
