import { ImageResponse } from 'next/og';
import { siteConfig } from '@/config/site';

export const runtime = 'nodejs';
export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Imagen que se ve al compartir la portada en redes y WhatsApp. */
export default async function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #07090f 0%, #0c1018 55%, #123a2a 100%)',
        padding: 80,
        color: '#f4f6fb',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: '#16c47f',
            color: '#07090f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 34,
            fontWeight: 700,
          }}
        >
          A
        </div>
        <div style={{ fontSize: 34, fontWeight: 700 }}>{siteConfig.name}</div>
      </div>

      <div style={{ fontSize: 62, fontWeight: 700, lineHeight: 1.15, maxWidth: 900 }}>
        Sistemas listos para copiar que hacen vender a tu ecommerce
      </div>

      <div style={{ marginTop: 32, fontSize: 28, color: '#8b96ad', maxWidth: 860 }}>
        Ecommerce · Dropshipping · Automatización con IA
      </div>
    </div>,
    size,
  );
}
