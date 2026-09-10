'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

/** Campo de solo lectura con copia al portapapeles. */
export function CopyLinkButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles el usuario siempre puede seleccionar el
      // texto a mano, que sigue visible en el campo.
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <label htmlFor="affiliate-link" className="sr-only">
        Tu enlace de afiliado
      </label>
      <input
        id="affiliate-link"
        readOnly
        value={value}
        onFocus={(event) => event.currentTarget.select()}
        className="h-11 flex-1 rounded-lg border border-ink-600 bg-ink-950 px-4 font-mono text-xs text-mist-200 outline-none focus:border-brand-500"
      />
      <Button onClick={handleCopy} variant="secondary">
        {copied ? '¡Copiado!' : 'Copiar'}
      </Button>
    </div>
  );
}
