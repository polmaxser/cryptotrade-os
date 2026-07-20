'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { createAdminEconomicEvent, updateAdminEconomicEvent } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/errors';
import type {
  EconomicEvent,
  EconomicEventCategory,
  EconomicEventImportance,
} from '@/types/economic-event';

const SELECT_CLASS =
  'border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

const CATEGORIES: EconomicEventCategory[] = ['FOMC', 'CPI', 'NFP'];
const IMPORTANCE_LEVELS: EconomicEventImportance[] = ['HIGH', 'MEDIUM', 'LOW'];

function toDatetimeLocal(iso: string): string {
  return new Date(iso).toISOString().slice(0, 16);
}

type AdminEconomicEventDialogProps = {
  event?: EconomicEvent;
  children: ReactNode;
  onDone?: () => void;
};

export function AdminEconomicEventDialog({
  event,
  children,
  onDone,
}: AdminEconomicEventDialogProps) {
  const t = useTranslations('admin.economicEvents.dialog');
  const tCategories = useTranslations('economicCalendar.categories');
  const tImportance = useTranslations('economicCalendar.importance');
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<EconomicEventCategory>(event?.category ?? 'CPI');
  const [importance, setImportance] = useState<EconomicEventImportance>(
    event?.importance ?? 'HIGH',
  );
  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [eventDate, setEventDate] = useState(event ? toDatetimeLocal(event.eventDate) : '');
  const [forecast, setForecast] = useState(event?.forecast ?? '');
  const [previous, setPrevious] = useState(event?.previous ?? '');
  const [actual, setActual] = useState(event?.actual ?? '');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        category,
        importance,
        title: title.trim(),
        description: description.trim() || undefined,
        eventDate: new Date(eventDate).toISOString(),
        forecast: forecast.trim() || undefined,
        previous: previous.trim() || undefined,
        actual: actual.trim() || undefined,
      };

      return event
        ? updateAdminEconomicEvent(event.id, payload)
        : createAdminEconomicEvent(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'economic-events'] });
      queryClient.invalidateQueries({ queryKey: ['economic-calendar'] });
      setOpen(false);
      setError(null);
      onDone?.();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : t('genericError')),
  });

  function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event ? t('editTitle') : t('createTitle')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventCategory">{t('categoryLabel')}</Label>
              <select
                id="eventCategory"
                value={category}
                onChange={(e) => setCategory(e.target.value as EconomicEventCategory)}
                className={SELECT_CLASS}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {tCategories(c)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventImportance">{t('importanceLabel')}</Label>
              <select
                id="eventImportance"
                value={importance}
                onChange={(e) => setImportance(e.target.value as EconomicEventImportance)}
                className={SELECT_CLASS}
              >
                {IMPORTANCE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {tImportance(level)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventTitle">{t('titleLabel')}</Label>
            <Input
              id="eventTitle"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventDescription">{t('descriptionLabel')}</Label>
            <Input
              id="eventDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventDate">{t('dateLabel')}</Label>
            <Input
              id="eventDate"
              type="datetime-local"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventForecast">{t('forecastLabel')}</Label>
              <Input
                id="eventForecast"
                value={forecast}
                onChange={(e) => setForecast(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventPrevious">{t('previousLabel')}</Label>
              <Input
                id="eventPrevious"
                value={previous}
                onChange={(e) => setPrevious(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventActual">{t('actualLabel')}</Label>
              <Input id="eventActual" value={actual} onChange={(e) => setActual(e.target.value)} />
            </div>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('saving') : event ? t('saveChanges') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
