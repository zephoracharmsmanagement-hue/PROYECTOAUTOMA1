'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { publicEnv } from '@/lib/env';

/** Acceso por magic link (OTP por email). */
export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('loading');

    const supabase = createSupabaseBrowserClient();
    const redirectTo = new URL('/auth/callback', publicEnv.NEXT_PUBLIC_SITE_URL);
    redirectTo.searchParams.set('next', next);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo.toString() },
    });

    if (error) {
      setState('error');
      setMessage(error.message);
      return;
    }

    setState('sent');
    setMessage('Revisa tu email: el enlace caduca en 60 minutos.');
  }

  if (state === 'sent') {
    return (
      <div className="mt-8 rounded-xl border border-brand-600 bg-ink-900 p-6">
        <p className="font-semibold text-brand-400">Enlace enviado</p>
        <p className="mt-2 text-sm text-mist-400">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
      <label htmlFor="email" className="text-sm text-mist-200">
        Email
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="tu@email.com"
        className="h-11 rounded-lg border border-ink-600 bg-ink-900 px-4 text-sm outline-none placeholder:text-mist-400 focus:border-brand-500"
      />
      <Button type="submit" size="lg" disabled={state === 'loading'}>
        {state === 'loading' ? 'Enviando…' : 'Enviarme el enlace'}
      </Button>
      {state === 'error' && (
        <p role="alert" className="text-sm text-red-400">
          {message}
        </p>
      )}
    </form>
  );
}
