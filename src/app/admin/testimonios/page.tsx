import type { Metadata } from 'next';
import { ActionButton } from '@/components/admin/action-button';
import { TestimonialForm } from '@/components/admin/testimonial-form';
import { Badge } from '@/components/ui/badge';
import { deleteTestimonial } from '@/lib/admin/actions/testimonials';
import { requireAdmin } from '@/lib/admin/guard';

export const metadata: Metadata = { title: 'Testimonios' };

export default async function AdminTestimonialsPage() {
  const { supabase } = await requireAdmin();

  const [{ data: testimonials }, { data: packages }] = await Promise.all([
    supabase.from('testimonials').select('*').order('sort_order'),
    supabase.from('packages').select('id, title').order('sort_order'),
  ]);

  const list = testimonials ?? [];
  const packageList = packages ?? [];

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-semibold">Testimonios</h2>
      <p className="mt-1 text-sm text-mist-400">
        Los testimonios con puntuación alimentan el marcado de reseñas que lee Google. Publica
        únicamente testimonios reales y verificables: inventarlos infringe las políticas de Google y
        la normativa de publicidad.
      </p>

      <div className="mt-6 flex flex-col gap-5">
        {list.map((testimonial) => (
          <div key={testimonial.id}>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge
                className={
                  testimonial.status === 'published' ? 'border-brand-600 text-brand-400' : undefined
                }
              >
                {testimonial.status}
              </Badge>
              {testimonial.rating && <Badge>{testimonial.rating}/5</Badge>}
              <span className="text-sm text-mist-400">{testimonial.author_name}</span>
              <ActionButton
                action={deleteTestimonial}
                fields={{ id: testimonial.id }}
                confirm={`¿Eliminar el testimonio de ${testimonial.author_name}?`}
                variant="ghost"
              >
                Eliminar
              </ActionButton>
            </div>
            <TestimonialForm testimonial={testimonial} packages={packageList} />
          </div>
        ))}
      </div>

      {list.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-ink-700 p-8 text-center text-sm text-mist-400">
          Todavía no hay testimonios.
        </p>
      )}

      <div className="mt-10">
        <h3 className="text-lg font-semibold">Añadir testimonio</h3>
        <div className="mt-4">
          <TestimonialForm packages={packageList} />
        </div>
      </div>
    </div>
  );
}
