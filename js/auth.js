/* ===========================================================
   Helpers de autenticación y roles.
   Roles posibles: propietario, admin, docente, psicologo, coordinador
   =========================================================== */

function claveDeCorreo(correo) {
  return correo.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
}

async function obtenerPerfil(uid) {
  const doc = await db.collection('usuarios').doc(uid).get();
  return doc.exists ? doc.data() : null;
}

/**
 * Protege una página: si no hay sesión o el rol no está permitido,
 * redirige a login.html. Devuelve { user, perfil } si todo está bien.
 */
function protegerPagina(rolesPermitidos, callback) {
  auth.onAuthStateChanged(async (user) => {
    if (!user) { window.location.href = 'login.html'; return; }
    const perfil = await obtenerPerfil(user.uid);
    if (!perfil || (rolesPermitidos && !rolesPermitidos.includes(perfil.rol))) {
      window.location.href = 'login.html';
      return;
    }
    callback({ user, perfil });
  });
}

function cerrarSesion() {
  auth.signOut().then(() => window.location.href = 'login.html');
}

function mostrarError(elId, texto) {
  const el = document.getElementById(elId);
  el.innerHTML = `<div class="msg error">${texto}</div>`;
}
function mostrarOk(elId, texto) {
  const el = document.getElementById(elId);
  el.innerHTML = `<div class="msg ok">${texto}</div>`;
}

function traducirErrorFirebase(codigo) {
  const mapa = {
    'auth/email-already-in-use': 'Ese correo ya tiene una cuenta creada.',
    'auth/invalid-email': 'El correo no es válido.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/user-not-found': 'No existe una cuenta con ese correo.',
    'auth/wrong-password': 'La contraseña es incorrecta.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/too-many-requests': 'Demasiados intentos. Espera un momento e intenta de nuevo.'
  };
  return mapa[codigo] || 'Ocurrió un error. Intenta de nuevo.';
}
