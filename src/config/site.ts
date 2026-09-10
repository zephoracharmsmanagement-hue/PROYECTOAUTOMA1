export const siteConfig = {
  name: 'Automa',
  tagline: 'Paquetes SaaS para vender más con tu ecommerce',
  description:
    'Sistemas listos para implementar de ecommerce, dropshipping y automatización con IA. Video paso a paso, plantillas y automatizaciones que puedes copiar hoy.',
  nav: [
    { label: 'Paquetes', href: '/paquetes' },
    { label: 'Rutas', href: '/rutas' },
    { label: 'Precios', href: '/precios' },
    { label: 'Cómo funciona', href: '/#como-funciona' },
    { label: 'Preguntas', href: '/#faq' },
  ],
  legal: [
    { label: 'Términos', href: '/legal/terminos' },
    { label: 'Privacidad', href: '/legal/privacidad' },
    { label: 'Reembolsos', href: '/legal/reembolsos' },
  ],
  support: {
    email: 'soporte@tudominio.com',
  },
} as const;

/** Días de garantía de devolución que se comunican en la landing. */
export const GUARANTEE_DAYS = 14;
