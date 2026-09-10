import 'server-only';

import { serverEnv } from '@/lib/env';
import { BunnyStreamProvider } from '@/lib/video/bunny';
import { VideoProviderError, type SignedPlayback } from '@/lib/video/provider';
import type { VideoProviderName } from '@/types/database.types';

export type { SignedPlayback, VideoProvider } from '@/lib/video/provider';
export { VideoProviderError } from '@/lib/video/provider';

/**
 * Punto unico de firma de reproduccion.
 * Solo debe invocarse DESPUES de haber verificado el entitlement del usuario.
 */
export async function signPlayback(
  provider: VideoProviderName,
  assetId: string | null,
): Promise<SignedPlayback> {
  if (!assetId) throw new VideoProviderError('La leccion todavia no tiene video publicado.');

  const ttlSeconds = serverEnv().BUNNY_TOKEN_TTL_MINUTES * 60;

  switch (provider) {
    case 'bunny':
      return BunnyStreamProvider.fromEnv().sign(assetId, ttlSeconds);

    case 'youtube':
      // Sin firma posible: la proteccion depende de que el video sea "no listado".
      return {
        embedUrl: `https://www.youtube-nocookie.com/embed/${assetId}?rel=0&modestbranding=1`,
        expiresAt: Math.floor(Date.now() / 1000) + ttlSeconds,
        provider,
      };

    case 'mux':
      throw new VideoProviderError('El adaptador de Mux aun no esta implementado.');

    case 'none':
    default:
      throw new VideoProviderError('Esta leccion no tiene proveedor de video configurado.');
  }
}
