import 'server-only';

import { siteConfig, GUARANTEE_DAYS } from '@/config/site';

/**
 * Plantillas de email transaccional.
 *
 * HTML con estilos en línea y tablas: es lo único que renderizan de forma
 * consistente Outlook y Gmail. Cada plantilla devuelve también su versión en
 * texto plano, que mejora la entregabilidad y sirve de respaldo.
 */

const COLORS = {
  bg: '#07090f',
  card: '#0c1018',
  border: '#1e2535',
  text: '#f4f6fb',
  muted: '#8b96ad',
  brand: '#16c47f',
};

function layout(options: { heading: string; body: string; ctaLabel: string; ctaUrl: string }) {
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:16px;padding:32px;">
            <tr>
              <td style="color:${COLORS.brand};font-size:18px;font-weight:700;padding-bottom:24px;">
                ${siteConfig.name}
              </td>
            </tr>
            <tr>
              <td style="color:${COLORS.text};font-size:24px;font-weight:700;line-height:1.3;padding-bottom:16px;">
                ${options.heading}
              </td>
            </tr>
            <tr>
              <td style="color:${COLORS.muted};font-size:15px;line-height:1.6;padding-bottom:28px;">
                ${options.body}
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:28px;">
                <a href="${options.ctaUrl}" style="display:inline-block;background:${COLORS.brand};color:${COLORS.bg};text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;">
                  ${options.ctaLabel}
                </a>
              </td>
            </tr>
            <tr>
              <td style="color:${COLORS.muted};font-size:13px;line-height:1.6;border-top:1px solid ${COLORS.border};padding-top:20px;">
                ¿Necesitas ayuda? Responde a este email o escribe a
                <a href="mailto:${siteConfig.support.email}" style="color:${COLORS.brand};">${siteConfig.support.email}</a>.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Confirmación de compra de un paquete de pago único. */
export function purchaseEmail(params: { packageTitle: string; libraryUrl: string }) {
  return {
    subject: `Ya tienes acceso a ${params.packageTitle}`,
    html: layout({
      heading: '¡Tu acceso ya está activo!',
      body: `Acabas de desbloquear <strong style="color:${COLORS.text};">${params.packageTitle}</strong>.
        El acceso es de por vida e incluye todas las actualizaciones futuras del paquete.
        <br><br>Empieza por la primera lección: está pensada para que veas el resultado
        completo antes de ponerte a implementar.`,
      ctaLabel: 'Entrar a mi biblioteca',
      ctaUrl: params.libraryUrl,
    }),
    text: `¡Tu acceso ya está activo!

Acabas de desbloquear ${params.packageTitle}. El acceso es de por vida e incluye todas las actualizaciones futuras.

Entra a tu biblioteca: ${params.libraryUrl}

¿Necesitas ayuda? Escribe a ${siteConfig.support.email}.`,
  };
}

/** Bienvenida al activar la membresía All Access. */
export function subscriptionEmail(params: { planName: string; libraryUrl: string }) {
  return {
    subject: `Bienvenido a ${siteConfig.name} All Access`,
    html: layout({
      heading: 'Todo el catálogo, desbloqueado',
      body: `Tu plan <strong style="color:${COLORS.text};">${params.planName}</strong> ya está activo.
        Tienes acceso a todos los paquetes publicados y a cada nuevo lanzamiento mientras
        tu membresía siga vigente.
        <br><br>Puedes gestionar o cancelar tu suscripción cuando quieras desde tu cuenta;
        conservarás el acceso hasta el final del periodo que ya has pagado.`,
      ctaLabel: 'Ver todo el catálogo',
      ctaUrl: params.libraryUrl,
    }),
    text: `Todo el catálogo, desbloqueado

Tu plan ${params.planName} ya está activo. Tienes acceso a todos los paquetes publicados y a cada nuevo lanzamiento.

Entra a tu biblioteca: ${params.libraryUrl}

Puedes cancelar cuando quieras desde tu cuenta y conservarás el acceso hasta el final del periodo pagado.

¿Necesitas ayuda? Escribe a ${siteConfig.support.email}.`,
  };
}

/** Aviso de acceso concedido manualmente desde el panel. */
export function manualGrantEmail(params: { itemName: string; libraryUrl: string }) {
  return {
    subject: `Se te ha dado acceso a ${params.itemName}`,
    html: layout({
      heading: 'Tienes acceso nuevo',
      body: `Hemos activado tu acceso a <strong style="color:${COLORS.text};">${params.itemName}</strong>.
        Ya puedes verlo desde tu biblioteca.`,
      ctaLabel: 'Ir a mi biblioteca',
      ctaUrl: params.libraryUrl,
    }),
    text: `Tienes acceso nuevo

Hemos activado tu acceso a ${params.itemName}. Entra en ${params.libraryUrl}

¿Necesitas ayuda? Escribe a ${siteConfig.support.email}.`,
  };
}

/**
 * Recuperacion de carrito abandonado.
 *
 * Un unico email, sin secuencia de insistencia: la sesion de checkout ya ha
 * caducado cuando se envia, asi que el enlace lleva de vuelta a la ficha de
 * venta y no a un pago muerto.
 */
export function abandonedCheckoutEmail(params: { packageTitle: string; packageUrl: string }) {
  return {
    subject: `¿Seguimos con ${params.packageTitle}?`,
    html: layout({
      heading: 'Dejaste algo a medias',
      body: `Empezaste el pago de <strong style="color:${COLORS.text};">${params.packageTitle}</strong>
        pero no llegaste a completarlo. Si fue un problema con la pasarela o simplemente
        te surgió algo, puedes retomarlo cuando quieras.
        <br><br>Recuerda que tienes ${GUARANTEE_DAYS} días de garantía: si no es para ti,
        te devolvemos el importe completo.`,
      ctaLabel: 'Retomar la compra',
      ctaUrl: params.packageUrl,
    }),
    text: `Dejaste algo a medias

Empezaste el pago de ${params.packageTitle} pero no llegaste a completarlo. Puedes retomarlo aquí: ${params.packageUrl}

Tienes ${GUARANTEE_DAYS} días de garantía: si no es para ti, te devolvemos el importe completo.

¿Necesitas ayuda? Escribe a ${siteConfig.support.email}.`,
  };
}

/** Aviso de fallo de cobro, antes de que Stripe agote los reintentos. */
export function paymentFailedEmail(params: { portalUrl: string }) {
  return {
    subject: 'No pudimos cobrar tu suscripción',
    html: layout({
      heading: 'Hay un problema con tu pago',
      body: `El último cobro de tu membresía no se ha podido completar. Lo reintentaremos
        automáticamente durante los próximos días, pero puedes resolverlo ahora actualizando
        tu método de pago.
        <br><br>Tu acceso sigue activo mientras tanto.`,
      ctaLabel: 'Actualizar método de pago',
      ctaUrl: params.portalUrl,
    }),
    text: `Hay un problema con tu pago

El último cobro de tu membresía no se ha podido completar. Lo reintentaremos automáticamente, pero puedes resolverlo ahora: ${params.portalUrl}

Tu acceso sigue activo mientras tanto.`,
  };
}

export const REFUND_WINDOW_DAYS = GUARANTEE_DAYS;
