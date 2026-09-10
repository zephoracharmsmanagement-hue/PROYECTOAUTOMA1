import type { TestimonialRow } from '@/types/database.types';

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} de 5`} className="text-sm text-brand-400">
      {'★'.repeat(rating)}
      <span className="text-ink-600">{'★'.repeat(5 - rating)}</span>
    </span>
  );
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function TestimonialCard({ testimonial }: { testimonial: TestimonialRow }) {
  return (
    <figure className="card-surface flex flex-col rounded-2xl p-6">
      {testimonial.rating && <Stars rating={testimonial.rating} />}

      {testimonial.result && (
        <p className="mt-3 text-lg font-bold text-brand-400">{testimonial.result}</p>
      )}

      <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-mist-200">
        “{testimonial.quote}”
      </blockquote>

      <figcaption className="mt-6 flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink-700 text-xs font-semibold text-mist-200">
          {initials(testimonial.author_name)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{testimonial.author_name}</span>
          {testimonial.author_role && (
            <span className="block truncate text-xs text-mist-400">{testimonial.author_role}</span>
          )}
        </span>
      </figcaption>

      {testimonial.source_url && (
        <a
          href={testimonial.source_url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-4 text-xs text-mist-400 hover:text-brand-400"
        >
          Ver el caso completo ↗
        </a>
      )}
    </figure>
  );
}

export function Testimonials({
  testimonials,
  title = 'Lo que consiguen quienes ya lo aplican',
  subtitle,
}: {
  testimonials: TestimonialRow[];
  title?: string;
  subtitle?: string;
}) {
  // Sin prueba social real es mejor no mostrar nada que mostrar un hueco vacío.
  if (testimonials.length === 0) return null;

  return (
    <section className="border-b border-ink-800 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-2 text-mist-400">{subtitle}</p>}

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}
