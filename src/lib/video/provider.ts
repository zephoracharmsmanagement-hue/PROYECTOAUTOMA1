import type { VideoProviderName } from '@/types/database.types';

export interface SignedPlayback {
  /** URL lista para incrustar en un <iframe>. */
  embedUrl: string;
  /** Instante (epoch en segundos) en el que el enlace deja de ser valido. */
  expiresAt: number;
  provider: VideoProviderName;
}

/**
 * Contrato de proveedor de video.
 *
 * Toda la aplicacion consume esta interfaz, nunca un SDK concreto. Cambiar de
 * Bunny a Mux (o a cualquier otro) se reduce a anadir un adaptador y una entrada
 * en el registro de `lib/video/index.ts`.
 */
export interface VideoProvider {
  readonly name: VideoProviderName;
  /** Firma un enlace de reproduccion de duracion limitada. */
  sign(assetId: string, ttlSeconds: number): Promise<SignedPlayback>;
}

export class VideoProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VideoProviderError';
  }
}
