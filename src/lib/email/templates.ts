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

/**
 * Dunning: aviso de cobro fallido, con un tono que escala según el intento.
 *
 * El número de intento lo trae la propia factura de Stripe, así que la escalada
 * no necesita ningún proceso programado. Tres niveles y para: insistir más allá
 * del tercero no recupera pagos, solo genera bajas y quejas.
 */
export function dunningEmail(params: { attempt: number; portalUrl: string }) {
  if (params.attempt <= 1) {
    return {
      subject: 'No pudimos cobrar tu suscripción',
      html: layout({
        heading: 'Hay un problema con tu pago',
        body: `El último cobro de tu membresía no se ha podido completar. Suele ser algo
          menor: una tarjeta caducada o un límite del banco.
          <br><br>Lo reintentaremos automáticamente, así que puede que no tengas que hacer
          nada. Si quieres resolverlo ya, actualiza tu método de pago.
          <br><br><strong style="color:${COLORS.text};">Tu acceso sigue activo.</strong>`,
        ctaLabel: 'Actualizar método de pago',
        ctaUrl: params.portalUrl,
      }),
      text: `Hay un problema con tu pago

El último cobro de tu membresía no se ha podido completar. Suele ser algo menor: una tarjeta caducada o un límite del banco.

Lo reintentaremos automáticamente. Si quieres resolverlo ya: ${params.portalUrl}

Tu acceso sigue activo.`,
    };
  }

  if (params.attempt === 2) {
    return {
      subject: 'Segundo intento fallido con tu suscripción',
      html: layout({
        heading: 'Seguimos sin poder cobrar',
        body: `Hemos vuelto a intentar el cobro de tu membresía y tampoco ha salido. Para
          que no pierdas el acceso, actualiza tu método de pago.
          <br><br>Si prefieres darte de baja, puedes hacerlo desde el mismo sitio en un
          clic; no hay permanencia ni penalización.`,
        ctaLabel: 'Revisar mi facturación',
        ctaUrl: params.portalUrl,
      }),
      text: `Seguimos sin poder cobrar

Hemos vuelto a intentar el cobro de tu membresía y tampoco ha salido. Actualiza tu método de pago aquí: ${params.portalUrl}

Si prefieres darte de baja, puedes hacerlo desde el mismo sitio. Sin permanencia ni penalización.`,
    };
  }

  return {
    subject: 'Tu acceso está a punto de pausarse',
    html: layout({
      heading: 'Último aviso antes de pausar tu acceso',
      body: `No hemos conseguido cobrar tu membresía tras varios intentos. Si no se
        resuelve en los próximos días, tu acceso quedará pausado.
        <br><br>No perderás nada de lo que ya compraste en pago único: eso es tuyo para
        siempre. Tampoco perderás tu progreso, y podrás reactivar la membresía cuando
        quieras.`,
      ctaLabel: 'Resolver ahora',
      ctaUrl: params.portalUrl,
    }),
    text: `Último aviso antes de pausar tu acceso

No hemos conseguido cobrar tu membresía tras varios intentos. Si no se resuelve en los próximos días, tu acceso quedará pausado.

Resuélvelo aquí: ${params.portalUrl}

No perderás lo que compraste en pago único ni tu progreso, y podrás reactivar la membresía cuando quieras.`,
  };
}

/** Aviso al afiliado de que ha generado una comisión. */
export function commissionEmail(params: { amountLabel: string; dashboardUrl: string }) {
  return {
    subject: `Nueva comisión de ${params.amountLabel}`,
    html: layout({
      heading: 'Has generado una comisión',
      body: `Una persona ha comprado a través de tu enlace y te corresponde
        <strong style="color:${COLORS.text};">${params.amountLabel}</strong>.
        <br><br>La comisión queda pendiente de aprobación durante el periodo de garantía;
        después pasa a liquidarse.`,
      ctaLabel: 'Ver mis comisiones',
      ctaUrl: params.dashboardUrl,
    }),
    text: `Has generado una comisión

Una persona ha comprado a través de tu enlace y te corresponde ${params.amountLabel}.

La comisión queda pendiente de aprobación durante el periodo de garantía. Consulta el detalle en ${params.dashboardUrl}`,
  };
}

export const REFUND_WINDOW_DAYS = GUARANTEE_DAYS;
