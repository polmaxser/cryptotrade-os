'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createJournalTag } from '@/lib/api/journal';
import { useJournalTagsQuery } from '@/hooks/use-journal-tags-query';
import type { JournalTagCategory } from '@/types/journal';

const CATEGORIES: JournalTagCategory[] = ['EMOTION', 'MISTAKE', 'STRATEGY'];

type JournalTagPickerProps = {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
};

export function JournalTagPicker({ selectedTagIds, onChange }: JournalTagPickerProps) {
  const t = useTranslations('journal.tags');
  const queryClient = useQueryClient();
  const tagsQuery = useJournalTagsQuery();
  const tags = tagsQuery.data ?? [];

  const [newTagName, setNewTagName] = useState<Record<JournalTagCategory, string>>({
    EMOTION: '',
    MISTAKE: '',
    STRATEGY: '',
  });

  const createMutation = useMutation({
    mutationFn: createJournalTag,
    onSuccess: (tag) => {
      queryClient.invalidateQueries({ queryKey: ['journal', 'tags'] });
      onChange([...selectedTagIds, tag.id]);
      setNewTagName((prev) => ({ ...prev, [tag.category]: '' }));
    },
  });

  function toggleTag(id: string) {
    onChange(
      selectedTagIds.includes(id)
        ? selectedTagIds.filter((tagId) => tagId !== id)
        : [...selectedTagIds, id],
    );
  }

  function handleAddTag(category: JournalTagCategory) {
    const name = newTagName[category].trim();
    if (!name) return;
    createMutation.mutate({ name, category });
  }

  return (
    <div className="space-y-4">
      {CATEGORIES.map((category) => {
        const categoryTags = tags.filter((tag) => tag.category === category);

        return (
          <div key={category} className="space-y-2">
            <Label>{t(`categories.${category}`)}</Label>

            {categoryTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {categoryTags.map((tag) => (
                  <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}>
                    <Badge variant={selectedTagIds.includes(tag.id) ? 'default' : 'outline'}>
                      {tag.name}
                    </Badge>
                  </button>
                ))}
              </div>
            ) : null}

            <div className="flex gap-2">
              <Input
                value={newTagName[category]}
                onChange={(event) =>
                  setNewTagName((prev) => ({ ...prev, [category]: event.target.value }))
                }
                placeholder={t('addPlaceholder')}
                className="h-8 max-w-[180px] text-xs"
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8"
                onClick={() => handleAddTag(category)}
                disabled={createMutation.isPending || !newTagName[category].trim()}
              >
                {t('addButton')}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
