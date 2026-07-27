/* ===========================================================
   Configuración general del sistema de citas.
   La lista de docentes/psicólogos/coordinador YA NO está aquí:
   ahora se administra desde admin.html y vive en Firestore
   (colección "personas"). Ver js/personas.js
   =========================================================== */

// (El horario de atención ya no es fijo para todos: cada persona define
// sus propios bloques desde mi-cuenta.html — ver js/horarios.js)

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

// Grados y secciones para el formulario de citas.
const GRADOS = [
  "Transición",
  "Primero", "Segundo", "Tercero", "Cuarto", "Quinto",
  "Sexto", "Séptimo", "Octavo", "Noveno", "Décimo", "Undécimo"
];
const SECCIONES = ["1", "2", "3", "4"];
