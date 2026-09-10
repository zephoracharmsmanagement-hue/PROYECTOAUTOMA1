/**
 * Constantes de experimentos compartidas entre el middleware (runtime edge) y el
 * servidor. Vive aparte de `experiments.ts` porque ese módulo importa
 * `server-only` y el middleware no puede cargarlo.
 */
export const ANONYMOUS_ID_COOKIE = 'automa_aid';
