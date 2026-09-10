'use client';

import { useEffect, useState } from 'react';

interface Props {
  lessonId: string;
  title: string;
}

interface PlaybackResponse {
  embedUrl?: string;
  expiresAt?: number;
  error?: string;
}

/**
 * Reproductor de lecciones.
 *
 * El enlace firmado se pide en el cliente pero se genera en el servidor tras
 * verificar el entitlement, y caduca. Asi el HTML nunca contiene una URL de
 * video reutilizable indefinidamente.
 */
export function VideoPlayer({ lessonId, title }: Props) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setEmbedUrl(null);
      setError(null);

      try {
        const response = await fetch(`/api/lessons/${lessonId}/playback`, { cache: 'no-store' });
        const payload = (await response.json()) as PlaybackResponse;

        if (cancelled) return;

        if (!response.ok || !payload.embedUrl) {
          setError(payload.error ?? 'No se pudo cargar el video.');
          return;
        }
        setEmbedUrl(payload.embedUrl);
      } catch {
        if (!cancelled) setError('Fallo de conexión al cargar el video.');
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl border border-ink-700 bg-ink-900">
      {embedUrl ? (
        <iframe
          src={embedUrl}
          title={title}
          loading="lazy"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="h-full w-full"
        />
      ) : (
        <div className="grid h-full place-items-center px-6 text-center text-sm text-mist-400">
          {error ?? 'Cargando video…'}
        </div>
      )}
    </div>
  );
}
