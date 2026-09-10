import { requireAdmin } from '@/lib/admin/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Escapa un valor para CSV según RFC 4180. */
function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/** Descarga de todos los leads en CSV. Protegido por la misma guardia del panel. */
export async function GET() {
  const { supabase } = await requireAdmin();

  const { data: leads, error } = await supabase
    .from('leads')
    .select('email, source, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return new Response('No se pudieron exportar los leads.', { status: 500 });
  }

  const rows = [
    ['email', 'origen', 'fecha'].join(','),
    ...(leads ?? []).map((lead) =>
      [csvCell(lead.email), csvCell(lead.source), csvCell(lead.created_at)].join(','),
    ),
  ];

  const filename = `leads-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
