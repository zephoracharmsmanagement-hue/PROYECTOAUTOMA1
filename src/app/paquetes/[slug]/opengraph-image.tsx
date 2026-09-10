import { ImageResponse } from 'next/og';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { siteConfig } from '@/config/site';

export const runtime = 'nodejs';
export const alt = 'Ficha del paquete';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Imagen de compartición por paquete: título real y promesa comercial. */
export default async function PackageOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let title = 'Paquete';
  let outcome: string | null = null;
  let category = 'ecommerce';

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from('packages')
      .select('title, outcome, subtitle, category')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (data) {
      title = data.title;
      outcome = data.outcome ?? data.subtitle;
      category = data.category;
    }
  } catch {
    // Una imagen genérica es mejor que un 500 en el desplegable de compartir.
  }

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #07090f 0%, #0c1018 55%, #123a2a 100%)',
        padding: 80,
        color: '#f4f6fb',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#16c47f',
            color: '#07090f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 30,
            fontWeight: 700,
          }}
        >
          A
        </div>
        <div style={{ fontSize: 28, fontWeight: 700 }}>{siteConfig.name}</div>
        <div
          style={{
            marginLeft: 12,
            fontSize: 22,
            color: '#8b96ad',
            border: '1px solid #2b3446',
            borderRadius: 999,
            padding: '6px 18px',
          }}
        >
          {category}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 58, fontWeight: 700, lineHeight: 1.15, maxWidth: 1000 }}>
          {title}
        </div>
        {outcome && (
          <div style={{ marginTop: 28, fontSize: 30, color: '#8b96ad', maxWidth: 960 }}>
            {outcome}
          </div>
        )}
      </div>
    </div>,
    size,
  );
}
