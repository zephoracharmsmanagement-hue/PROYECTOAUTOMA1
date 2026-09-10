import 'server-only';

import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ANONYMOUS_ID_COOKIE } from '@/lib/experiments.shared';
import type { ExperimentRow, ExperimentVariant } from '@/types/database.types';

/**
 * Motor de experimentos A/B.
 *
 * La asignación es **determinista**: se deriva de un identificador anónimo en
 * cookie (`automa_aid`, que fija el middleware) combinado con la clave del
 * experimento. No hace falta una cookie por experimento, la misma persona ve
 * siempre la misma variante, y añadir un experimento no invalida los demás.
 */

export { ANONYMOUS_ID_COOKIE } from '@/lib/experiments.shared';

export interface Assignment<T = Record<string, string>> {
  experimentKey: string;
  variantId: string;
  payload: T;
}

/** FNV-1a: barato, sin dependencias y con reparto uniforme suficiente. */
function hash(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** Elige variante repartiendo por pesos acumulados sobre el bucket 0..99. */
export function pickVariant(
  variants: ExperimentVariant[],
  experimentKey: string,
  anonymousId: string,
): ExperimentVariant | null {
  const usable = variants.filter((variant) => variant.weight > 0);
  if (usable.length === 0) return null;

  const totalWeight = usable.reduce((sum, variant) => sum + variant.weight, 0);
  const bucket = hash(`${experimentKey}:${anonymousId}`) % totalWeight;

  let cumulative = 0;
  for (const variant of usable) {
    cumulative += variant.weight;
    if (bucket < cumulative) return variant;
  }

  return usable[usable.length - 1] ?? null;
}

/**
 * Resuelve el experimento activo para el visitante actual.
 *
 * Devuelve `null` si el experimento no existe, está pausado o no tiene variantes
 * utilizables: la página debe seguir funcionando con su contenido por defecto.
 */
export async function getAssignment<T extends Record<string, string> = Record<string, string>>(
  key: string,
): Promise<Assignment<T> | null> {
  const [cookieStore, supabase] = await Promise.all([cookies(), createSupabaseServerClient()]);

  const anonymousId = cookieStore.get(ANONYMOUS_ID_COOKIE)?.value;
  if (!anonymousId) return null;

  const { data } = await supabase
    .from('experiments')
    .select('key, variants, is_active')
    .eq('key', key)
    .eq('is_active', true)
    .maybeSingle();

  const experiment = data as Pick<ExperimentRow, 'key' | 'variants' | 'is_active'> | null;
  if (!experiment) return null;

  const variant = pickVariant(experiment.variants ?? [], key, anonymousId);
  if (!variant) return null;

  return {
    experimentKey: key,
    variantId: variant.id,
    payload: (variant.payload ?? {}) as T,
  };
}
