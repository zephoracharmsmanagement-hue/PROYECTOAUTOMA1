import 'server-only';

import { createHash } from 'node:crypto';
import { serverEnv } from '@/lib/env';
import { VideoProviderError, type SignedPlayback, type VideoProvider } from '@/lib/video/provider';

/**
 * Adaptador de Bunny Stream.
 *
 * Bunny valida los embeds con un token: SHA256(claveLibreria + videoId + expires).
 * La clave nunca sale del servidor; el navegador solo recibe el token ya
 * calculado y con caducidad, de modo que un enlace filtrado muere solo.
 */
export class BunnyStreamProvider implements VideoProvider {
  readonly name = 'bunny' as const;

  constructor(
    private readonly libraryId: string,
    private readonly apiKey: string,
  ) {}

  static fromEnv(): BunnyStreamProvider {
    const env = serverEnv();
    if (!env.BUNNY_STREAM_LIBRARY_ID || !env.BUNNY_STREAM_API_KEY) {
      throw new VideoProviderError(
        'Bunny Stream no esta configurado: define BUNNY_STREAM_LIBRARY_ID y BUNNY_STREAM_API_KEY.',
      );
    }
    return new BunnyStreamProvider(env.BUNNY_STREAM_LIBRARY_ID, env.BUNNY_STREAM_API_KEY);
  }

  async sign(assetId: string, ttlSeconds: number): Promise<SignedPlayback> {
    if (!assetId) throw new VideoProviderError('La leccion no tiene video asociado.');

    const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
    const token = createHash('sha256').update(`${this.apiKey}${assetId}${expiresAt}`).digest('hex');

    const url = new URL(`https://iframe.mediadelivery.net/embed/${this.libraryId}/${assetId}`);
    url.searchParams.set('token', token);
    url.searchParams.set('expires', String(expiresAt));
    url.searchParams.set('autoplay', 'false');
    url.searchParams.set('preload', 'true');

    return { embedUrl: url.toString(), expiresAt, provider: this.name };
  }
}
