import { z } from 'zod';

/**
 * Validacion de variables de entorno en el arranque.
 *
 * Regla de seguridad: las variables privadas NO se leen nunca desde un
 * componente cliente. `serverEnv` lanza si se invoca en el navegador, lo que
 * convierte una fuga de secretos en un error de build/runtime inmediato.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  BUNNY_STREAM_LIBRARY_ID: z.string().min(1).optional(),
  BUNNY_STREAM_API_KEY: z.string().min(1).optional(),
  BUNNY_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(180),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
});

function format(error: z.ZodError): string {
  return error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
}

// Next.js sustituye NEXT_PUBLIC_* en build time, por eso se listan literalmente.
const parsedPublic = publicSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
});

/**
 * `SKIP_ENV_VALIDATION=1` permite compilar sin secretos (CI, analisis estatico,
 * imagenes de Docker). NUNCA debe activarse en el proceso que sirve trafico.
 */
const skipValidation = process.env.SKIP_ENV_VALIDATION === '1';

if (!parsedPublic.success && !skipValidation) {
  throw new Error(
    `Variables de entorno publicas invalidas:\n${format(parsedPublic.error)}\n` +
      'Copia .env.example a .env.local y completalas.',
  );
}

export const publicEnv = parsedPublic.success
  ? parsedPublic.data
  : // Solo alcanzable con SKIP_ENV_VALIDATION: valores inertes para que el
    // build resuelva los tipos sin exponer nada real.
    ({
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
      NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'build-placeholder',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: undefined,
    } satisfies z.infer<typeof publicSchema>);

let cachedServerEnv: z.infer<typeof serverSchema> | null = null;

/** Acceso perezoso a los secretos del servidor. Lanza si se llama en cliente. */
export function serverEnv(): z.infer<typeof serverSchema> {
  if (typeof window !== 'undefined') {
    throw new Error('serverEnv() no puede usarse en el cliente: expondria secretos.');
  }
  if (cachedServerEnv) return cachedServerEnv;

  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Variables de entorno de servidor invalidas:\n${format(parsed.error)}`);
  }
  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}

export const isProduction = process.env.NODE_ENV === 'production';
