/* ===========================================================
   Calendario semanal (Lunes a Viernes) basado en el horario
   propio de cada persona (ver js/horarios.js). Cada día muestra
   solo las horas que esa persona configuró, y permite agendar.
   =========================================================== */

const params = new URLSearchParams(window.location.search);
const categoria = params.get('categoria') || 'docente';
const personaId = params.get('persona');

let persona = null;
let bloquesHorario = [];

const nombrePersonaEl = document.getElementById('nombrePersona');
const rolPersonaEl = document.getElementById('rolPersona');
const avatarEl = document.getElementById('avatar');
const volverEl = document.getElementById('volver');
const msgArea = document.getElementById('msgArea');

const roles = { docente: 'Docente', psicologo: 'Psicóloga institucional', coordinador: 'Coordinador', rector: 'Rector' };

volverEl.href = categoria === 'coordinador' ? 'lista.html?categoria=coordinador' : `lista.html?categoria=${categoria}`;

async function iniciar() {
  persona = await obtenerPersona(personaId);
  if (!persona) {
    nombrePersonaEl.textContent = 'Persona no encontrada';
    rolPersonaEl.textContent = 'Revisa el enlace o vuelve a la lista.';
    return;
  }
  nombrePersonaEl.textContent = persona.nombre;
  rolPersonaEl.textContent = roles[categoria] || '';
  const fotoEl = document.getElementById('fotoPersona');
  if (persona.fotoBase64) {
    fotoEl.src = persona.fotoBase64;
    fotoEl.style.display = 'block';
    avatarEl.style.display = 'none';
  } else {
    avatarEl.textContent = persona.nombre.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
  }

  const dlGrados = document.getElementById('listaGrados');
  GRADOS.forEach(g => { const o = document.createElement('option'); o.value = g; dlGrados.appendChild(o); });
  const dlSecciones = document.getElementById('listaSecciones');
  SECCIONES.forEach(s => { const o = document.createElement('option'); o.value = s; dlSecciones.appendChild(o); });

  bloquesHorario = await obtenerHorario(personaId);
  cargarSemana();
}

/* ---------- Manejo de fechas ---------- */
function lunesDeSemana(offsetSemanas) {
  const hoy = new Date();
  const dia = hoy.getDay();
  const diffAlLunes = (dia === 0 ? -6 : 1 - dia);
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diffAlLunes + offsetSemanas * 7);
  lunes.setHours(0,0,0,0);
  return lunes;
}
function formatoFecha(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function formatoCorto(d) {
  return d.toLocaleDateString('es-CO', { day:'2-digit', month:'short' });
}

let offsetSemanas = 0;
let ocupados = new Set(); // claves "YYYY-MM-DD_HH:MM"

const grid = document.getElementById('grid');
const rangoSemanaEl = document.getElementById('rangoSemana');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');

btnPrev.addEventListener('click', () => { if (offsetSemanas > 0) { offsetSemanas--; cargarSemana(); } });
btnNext.addEventListener('click', () => { offsetSemanas++; cargarSemana(); });

async function cargarSemana() {
  btnPrev.disabled = offsetSemanas === 0;
  const lunes = lunesDeSemana(offsetSemanas);
  const viernes = new Date(lunes); viernes.setDate(lunes.getDate() + 4);
  rangoSemanaEl.textContent = `${formatoCorto(lunes)} — ${formatoCorto(viernes)} de ${viernes.getFullYear()}`;

  ocupados = new Set();
  if (persona && typeof db !== 'undefined') {
    try {
      const [citasSnap, bloqueosSnap] = await Promise.all([
        db.collection('citas')
          .where('personaId', '==', persona.id)
          .where('fecha', '>=', formatoFecha(lunes))
          .where('fecha', '<=', formatoFecha(viernes))
          .get(),
        db.collection('bloqueos')
          .where('personaId', '==', persona.id)
          .where('fecha', '>=', formatoFecha(lunes))
          .where('fecha', '<=', formatoFecha(viernes))
          .get()
      ]);
      citasSnap.forEach(doc => {
        const c = doc.data();
        ocupados.add(`${c.fecha}_${c.hora}`);
      });
      bloqueosSnap.forEach(doc => {
        const b = doc.data();
        ocupados.add(`${b.fecha}_${b.hora}`);
      });
    } catch (e) {
      console.error(e);
      mostrarMensaje('error', 'No se pudieron cargar las citas existentes. Revisa la configuración de Firebase.');
    }
  }
  renderColumnas(lunes);
}

function renderColumnas(lunes) {
  grid.innerHTML = '';
  const ahora = new Date();
  let diasConHorario = 0;

  for (let i = 0; i < 5; i++) {
    const d = new Date(lunes); d.setDate(lunes.getDate() + i);
    const fechaStr = formatoFecha(d);
    const slots = generarSlotsDelDia(bloquesHorario, i);
    if (slots.length === 0) continue;
    diasConHorario++;

    const col = document.createElement('div');
    col.className = 'dia-columna';
    col.innerHTML = `<div class="cab">${DIAS_SEMANA[i]}<span class="fecha">${formatoCorto(d)}</span></div>`;
    const lista = document.createElement('div');
    lista.className = 'lista-slots';

    slots.forEach(s => {
      const horaStr = s.inicio;
      const etiqueta = `${s.inicio}–${s.fin}`;
      const clave = `${fechaStr}_${horaStr}`;
      const [hh, mm] = horaStr.split(':').map(Number);
      const slotDate = new Date(d); slotDate.setHours(hh, mm, 0, 0);
      const esPasado = slotDate < ahora;
      const btn = document.createElement('div');

      if (ocupados.has(clave)) {
        btn.className = 'slot-btn ocupado';
        btn.textContent = `${etiqueta} · Ocupado`;
      } else if (esPasado) {
        btn.className = 'slot-btn pasado';
        btn.textContent = etiqueta;
      } else {
        btn.className = 'slot-btn';
        btn.textContent = `${etiqueta} · Libre`;
        btn.addEventListener('click', () => abrirModal(fechaStr, horaStr, d));
      }
      lista.appendChild(btn);
    });
    col.appendChild(lista);
    grid.appendChild(col);
  }

  if (diasConHorario === 0) {
    grid.innerHTML = '<p style="color:var(--texto-suave); padding:20px;">Esta persona todavía no tiene horario de atención configurado.</p>';
  }
}

function mostrarMensaje(tipo, texto) {
  msgArea.innerHTML = `<div class="msg ${tipo}">${texto}</div>`;
  setTimeout(() => { msgArea.innerHTML = ''; }, 5000);
}

function mostrarConfirmacion(c) {
  enviarCorreoNotificacion(c);
  msgArea.innerHTML = `
    <div class="msg ok">
      La cita quedó agendada correctamente. Se le notificó automáticamente por correo a la persona.
    </div>`;
}

async function enviarCorreoNotificacion(c) {
  if (!persona.correoNotificacion || typeof emailjs === 'undefined') return;
  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: persona.correoNotificacion,
      persona_nombre: persona.nombre,
      fecha: c.fecha,
      hora: c.hora,
      representante: c.representante,
      telefono: c.telefono,
      estudiante: c.estudiante,
      grado: c.grado,
      seccion: c.seccion,
      motivo: c.motivo || 'No especificado'
    });
  } catch (e) {
    console.error('No se pudo enviar el correo de notificación:', e);
  }
}

/* ---------- Modal de agendamiento ---------- */
const modalBg = document.getElementById('modalBg');
const detalleSlot = document.getElementById('detalleSlot');
const inpRepresentante = document.getElementById('inpRepresentante');
const inpTelefono = document.getElementById('inpTelefono');
const inpEstudiante = document.getElementById('inpEstudiante');
const inpGrado = document.getElementById('inpGrado');
const inpSeccion = document.getElementById('inpSeccion');
const inpMotivo = document.getElementById('inpMotivo');
const modalError = document.getElementById('modalError');
const btnConfirmar = document.getElementById('btnConfirmar');
const btnCancelar = document.getElementById('btnCancelar');

let slotSeleccionado = null;

function abrirModal(fechaStr, horaStr, diaObj) {
  slotSeleccionado = { fecha: fechaStr, hora: horaStr };
  const nombreDia = DIAS_SEMANA[(diaObj.getDay() + 6) % 7];
  detalleSlot.textContent = `${nombreDia}, ${formatoCorto(diaObj)} — ${horaStr}`;
  inpRepresentante.value = '';
  inpTelefono.value = '';
  inpEstudiante.value = '';
  inpGrado.value = '';
  inpSeccion.value = '';
  inpMotivo.value = '';
  modalError.innerHTML = '';
  modalBg.classList.add('open');
}
function cerrarModal() { modalBg.classList.remove('open'); slotSeleccionado = null; }

btnCancelar.addEventListener('click', cerrarModal);
modalBg.addEventListener('click', (e) => { if (e.target === modalBg) cerrarModal(); });

btnConfirmar.addEventListener('click', async () => {
  const representante = inpRepresentante.value.trim();
  const telefono = inpTelefono.value.trim();
  const estudiante = inpEstudiante.value.trim();
  const grado = inpGrado.value.trim();
  const seccion = inpSeccion.value.trim();
  const motivo = inpMotivo.value.trim();

  if (!representante || !telefono || !estudiante || !grado || !seccion) {
    modalError.innerHTML = `<div class="msg error">Completa representante, teléfono, estudiante, grado y sección.</div>`;
    return;
  }
  if (!slotSeleccionado || !persona) return;

  btnConfirmar.disabled = true;
  btnConfirmar.textContent = 'Guardando...';

  try {
    await db.collection('citas').add({
      personaId: persona.id,
      nombrePersona: persona.nombre,
      categoria: categoria,
      representante, telefono, estudiante, grado, seccion, motivo,
      fecha: slotSeleccionado.fecha,
      hora: slotSeleccionado.hora,
      creado: firebase.firestore.FieldValue.serverTimestamp()
    });
    ocupados.add(`${slotSeleccionado.fecha}_${slotSeleccionado.hora}`);
    const datosCita = { fecha: slotSeleccionado.fecha, hora: slotSeleccionado.hora, representante, estudiante, grado, seccion, motivo };
    cerrarModal();
    mostrarConfirmacion(datosCita);
    cargarSemana();
  } catch (e) {
    console.error(e);
    modalError.innerHTML = `<div class="msg error">No se pudo guardar la cita. Intenta de nuevo.</div>`;
  } finally {
    btnConfirmar.disabled = false;
    btnConfirmar.textContent = 'Confirmar cita';
  }
});

iniciar();
