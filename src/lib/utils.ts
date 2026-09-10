/** Une clases condicionales sin dependencias externas. */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

/** Formatea un importe en centavos a moneda legible. */
export function formatPrice(cents: number, currency = 'usd', locale = 'es-ES'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/** Convierte segundos a "1h 24m" o "8m". */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '--';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

/** Construye una URL absoluta a partir de una ruta relativa del sitio. */
export function absoluteUrl(path: string, siteUrl: string): string {
  return new URL(path, siteUrl).toString();
}
