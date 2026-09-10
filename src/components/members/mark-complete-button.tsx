'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { markLessonComplete } from '@/app/biblioteca/[slug]/[lessonSlug]/actions';

export function MarkCompleteButton({
  lessonId,
  packageSlug,
  initiallyCompleted,
}: {
  lessonId: string;
  packageSlug: string;
  initiallyCompleted: boolean;
}) {
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await markLessonComplete({ lessonId, packageSlug });
      if (result.ok) setCompleted(true);
      else setError(result.error);
    });
  }

  if (completed) {
    return (
      <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-400">
        <span aria-hidden>✓</span> Lección completada
      </p>
    );
  }

  return (
    <div>
      <Button onClick={handleClick} disabled={pending} variant="secondary">
        {pending ? 'Guardando…' : 'Marcar como completada'}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
