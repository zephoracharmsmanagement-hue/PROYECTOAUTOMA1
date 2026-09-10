'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

/** Captura de email para la secuencia de nurturing. */
export function LeadForm({ source = 'landing' }: { source?: string }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('loading');

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setState('error');
        setMessage(payload.error ?? 'No pudimos guardar tu email.');
        return;
      }

      setState('done');
      setMessage('Listo. Revisa tu bandeja de entrada.');
      setEmail('');
    } catch {
      setState('error');
      setMessage('Fallo de conexión. Inténtalo de nuevo.');
    }
  }

  if (state === 'done') {
    return <p className="text-sm text-brand-400">{message}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
      <label htmlFor="lead-email" className="sr-only">
        Email
      </label>
      <input
        id="lead-email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="tu@email.com"
        className="h-11 flex-1 rounded-lg border border-ink-600 bg-ink-900 px-4 text-sm outline-none placeholder:text-mist-400 focus:border-brand-500"
      />
      <Button type="submit" disabled={state === 'loading'}>
        {state === 'loading' ? 'Enviando…' : 'Recibir la clase gratis'}
      </Button>
      {state === 'error' && (
        <p role="alert" className="text-sm text-red-400">
          {message}
        </p>
      )}
    </form>
  );
}
