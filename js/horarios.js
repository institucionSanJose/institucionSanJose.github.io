/* ===========================================================
   Horario semanal recurrente de cada docente/psicólogo/coordinador.
   Cada persona define sus propios bloques (día, hora inicio, hora
   fin, duración de cada cita) y el sistema genera automáticamente
   las citas disponibles dividiendo el bloque en esa duración.
   =========================================================== */

const DIAS_CLAVE = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

async function obtenerHorario(personaId) {
  const doc = await db.collection('horarios').doc(personaId).get();
  return doc.exists ? (doc.data().bloques || []) : [];
}

async function guardarHorario(personaId, bloques) {
  await db.collection('horarios').doc(personaId).set({ bloques });
}

/**
 * Devuelve los bloques configurados para un día de la semana
 * (0=lunes ... 4=viernes). Cada bloque es UNA sola cita disponible
 * (de "inicio" a "fin"), sin subdividir.
 */
function generarSlotsDelDia(bloques, diaIndex) {
  const clave = DIAS_CLAVE[diaIndex];
  return bloques
    .filter(b => b.dia === clave)
    .map(b => ({ inicio: b.inicio, fin: b.fin }))
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
}
