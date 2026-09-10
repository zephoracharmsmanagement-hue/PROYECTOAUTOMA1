import type { Metadata } from 'next';
import Link from 'next/link';
import { PackageForm } from '@/components/admin/package-form';
import { requireAdmin } from '@/lib/admin/guard';

export const metadata: Metadata = { title: 'Nuevo paquete' };

export default async function NewPackagePage() {
  await requireAdmin();

  return (
    <div className="max-w-4xl">
      <Link href="/admin/paquetes" className="text-sm text-mist-400 hover:text-mist-50">
        ← Paquetes
      </Link>

      <h2 className="mt-3 text-xl font-semibold">Nuevo paquete</h2>
      <p className="mt-1 text-sm text-mist-400">
        Se crea como borrador. Podrás añadir módulos, lecciones y bullets de valor al guardarlo.
      </p>

      <div className="mt-8">
        <PackageForm />
      </div>
    </div>
  );
}
