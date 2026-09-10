import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Contrato de recuperación de contexto.
 *
 * La aplicación consume esta interfaz, nunca una implementación concreta. Es el
 * mismo patrón que `VideoProvider`: cambiar de búsqueda léxica a búsqueda
 * vectorial es añadir un adaptador, no reescribir el asistente.
 */
export interface RetrievedChunk {
  id: string;
  packageId: string;
  lessonId: string | null;
  heading: string;
  content: string;
  score: number;
}

export interface Retriever {
  readonly name: string;
  retrieve(
    query: string,
    options: { packageId?: string; limit?: number },
  ): Promise<RetrievedChunk[]>;
}

/**
 * Recuperación léxica sobre Postgres: búsqueda de texto completo en español más
 * similitud por trigramas.
 *
 * Por qué esta y no embeddings: la API de Anthropic no ofrece endpoint de
 * embeddings, así que un índice vectorial obligaría a contratar un proveedor
 * más. Esta implementación funciona sin ninguna dependencia externa y acierta
 * bien con terminología concreta, que es la mayoría de lo que pregunta un
 * alumno ("¿cómo conecto el webhook?"). Es más débil ante paráfrasis puramente
 * semánticas; ahí es donde compensa pasar a vectores.
 *
 * La función SQL comprueba el acceso paquete a paquete: el asistente no puede
 * citar contenido que el alumno no haya comprado.
 */
export class LexicalRetriever implements Retriever {
  readonly name = 'postgres-lexical';

  async retrieve(
    query: string,
    options: { packageId?: string; limit?: number } = {},
  ): Promise<RetrievedChunk[]> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.rpc('search_content_chunks', {
      p_query: query,
      p_package_id: options.packageId ?? null,
      p_limit: options.limit ?? 8,
    });

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      packageId: row.package_id,
      lessonId: row.lesson_id,
      heading: row.heading,
      content: row.content,
      score: row.score,
    }));
  }
}

/** Recuperador activo. Punto único de cambio para enchufar otro adaptador. */
export function getRetriever(): Retriever {
  return new LexicalRetriever();
}
