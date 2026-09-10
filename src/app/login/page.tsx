import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/members/login-form';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Entrar' };
export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await getCurrentUser();

  if (user) redirect(next && next.startsWith('/') ? next : '/dashboard');

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-20">
      <h1 className="text-3xl font-bold tracking-tight">Accede a tu cuenta</h1>
      <p className="mt-2 text-sm text-mist-400">
        Te enviamos un enlace de acceso a tu email. Sin contraseñas que recordar.
      </p>

      {/* Solo se propaga la ruta si es interna: evita open redirect. */}
      <LoginForm next={next && next.startsWith('/') ? next : '/dashboard'} />
    </div>
  );
}
