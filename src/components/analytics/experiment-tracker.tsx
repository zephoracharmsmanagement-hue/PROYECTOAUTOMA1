'use client';

import { useEffect } from 'react';
import { setExperimentContext, track } from '@/lib/analytics/track';

/**
 * Registra la variante asignada y la adjunta a los eventos posteriores.
 *
 * El contexto se fija de forma síncrona en el render para que un clic muy rápido
 * en el botón de compra no se escape sin etiquetar; el evento de exposición sí
 * espera al efecto, para no emitirse dos veces en modo estricto.
 */
export function ExperimentTracker({
  experimentKey,
  variantId,
}: {
  experimentKey: string;
  variantId: string;
}) {
  setExperimentContext(experimentKey, variantId);

  useEffect(() => {
    setExperimentContext(experimentKey, variantId);
    track({ name: 'experiment_viewed', props: { experiment: experimentKey, variant: variantId } });
  }, [experimentKey, variantId]);

  return null;
}
