'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { markLessonComplete } from '@/app/biblioteca/[slug]/[lessonSlug]/actions';
import { track } from '@/lib/analytics/track';

export function MarkCompleteButton({
  lessonId,
  packageId,
  packageSlug,
  initiallyCompleted,
}: {
  lessonId: string;
  packageId: string;
  packageSlug: string;
  initiallyCompleted: boolean;
}) {
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [certificateCode, setCertificateCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await markLessonComplete({ lessonId, packageId, packageSlug });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setCompleted(true);

      if (result.certificateCode) {
        setCertificateCode(result.certificateCode);
        track({ name: 'certificate_issued', props: { package_slug: packageSlug } });
      }
    });
  }

  if (completed) {
    return (
      <div className="flex flex-wrap items-center gap-4">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-400">
          <span aria-hidden>✓</span> Lección completada
        </p>
        {certificateCode && (
          <Link
            href={`/certificado/${certificateCode}`}
            className="text-sm font-semibold text-brand-400 underline"
          >
            ¡Has terminado el paquete! Ver tu certificado →
          </Link>
        )}
      </div>
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
