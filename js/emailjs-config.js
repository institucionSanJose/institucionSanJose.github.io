/* ===========================================================
   CONFIGURACIÓN DE EMAILJS — para el correo automático al agendar
   Consigue estos 3 valores en tu cuenta de emailjs.com:
   - Public Key: Account → General
   - Service ID: Email Services → tu servicio
   - Template ID: Email Templates → tu plantilla
   =========================================================== */

const EMAILJS_PUBLIC_KEY = 'TU_PUBLIC_KEY';
const EMAILJS_SERVICE_ID = 'TU_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'TU_TEMPLATE_ID';

emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
