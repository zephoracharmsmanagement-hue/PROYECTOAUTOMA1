/**
 * Constantes de afiliados compartidas con el middleware (runtime edge), que no
 * puede importar modulos marcados `server-only`.
 */
export const REFERRAL_COOKIE = 'automa_ref';

/** Ventana de atribucion: 90 dias desde el clic en el enlace del afiliado. */
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

/** Parametro de la URL que activa la atribucion: /?ref=CODIGO */
export const REFERRAL_PARAM = 'ref';
