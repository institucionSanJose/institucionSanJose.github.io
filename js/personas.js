/* ===========================================================
   Personas (docentes, psicólogos, coordinador) — ahora viven en
   Firestore (colección "personas"), no en un archivo fijo, para
   que el administrador las pueda agregar/quitar desde admin.html.
   =========================================================== */

async function listarPersonas(categoria) {
  const snap = await db.collection('personas').where('categoria', '==', categoria).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => a.nombre.localeCompare(b.nombre));
}

async function listarTodasLasPersonas() {
  const snap = await db.collection('personas').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function obtenerPersona(id) {
  if (!id) return null;
  const doc = await db.collection('personas').doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

async function crearPersona(nombre, categoria, telefono, fotoBase64) {
  const ref = await db.collection('personas').add({
    nombre, categoria,
    telefono: telefono || null,
    fotoBase64: fotoBase64 || null
  });
  return ref.id;
}

/**
 * Redimensiona y recorta una imagen a un cuadrado (por defecto 300x300)
 * y la devuelve como base64 JPEG, para que quede un tamaño prolijo
 * sin importar la foto original que se suba.
 */
function procesarFotoCuadrada(file, tamano = 300) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = tamano; canvas.height = tamano;
        const ctx = canvas.getContext('2d');
        const lado = Math.min(img.width, img.height);
        const sx = (img.width - lado) / 2;
        const sy = (img.height - lado) / 2;
        ctx.drawImage(img, sx, sy, lado, lado, 0, 0, tamano, tamano);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function actualizarPersona(id, datos) {
  await db.collection('personas').doc(id).update(datos);
}

async function eliminarPersona(id) {
  await db.collection('personas').doc(id).delete();
}
