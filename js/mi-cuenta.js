/* ===========================================================
   Panel "Mi cuenta": el docente/psicólogo/coordinador define su
   horario semanal recurrente (bloques con hora exacta), ve/bloquea
   horas puntuales, y consulta el detalle de sus citas.
   =========================================================== */

let perfilActual = null;
let offsetSemanas = 0;
let bloquesActuales = [];

protegerPagina(['docente', 'psicologo', 'coordinador'], async ({ user, perfil }) => {
  perfilActual = perfil;
  const persona = await obtenerPersona(perfil.personaId);
  document.getElementById('quienSoy').textContent =
    `${perfil.correo} — ${persona ? persona.nombre : ''}`;
  await cargarBloques();
  cargarSemana();
  cargarAnio();
  cargarProximasCitas();
});

/* ---------- Configuración del horario semanal ---------- */
const nombresDia = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves', viernes: 'Viernes' };

async function cargarBloques() {
  bloquesActuales = await obtenerHorario(perfilActual.personaId);
  renderTablaBloques();
}

function renderTablaBloques() {
  const tbody = document.querySelector('#tablaBloques tbody');
  tbody.innerHTML = '';
  if (bloquesActuales.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3">Todavía no has configurado ningún horario. Agrega uno arriba.</td></tr>';
    return;
  }
  bloquesActuales.forEach((b, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${nombresDia[b.dia]}</td>
      <td class="mono">${b.inicio} – ${b.fin}</td>
      <td><button class="btn-mini" data-i="${i}">Eliminar</button></td>
    `;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('button[data-i]').forEach(btn => {
    btn.addEventListener('click', async () => {
      bloquesActuales.splice(Number(btn.dataset.i), 1);
      await guardarHorario(perfilActual.personaId, bloquesActuales);
      renderTablaBloques();
      cargarSemana();
    });
  });
}

document.getElementById('btnAgregarBloque').addEventListener('click', async () => {
  const dia = document.getElementById('selDiaBloque').value;
  const inicio = document.getElementById('inpInicioBloque').value;
  const fin = document.getElementById('inpFinBloque').value;

  if (!inicio || !fin) {
    mostrarError('msgArea', 'Completa la hora de inicio y la hora de fin.');
    return;
  }
  if (inicio >= fin) {
    mostrarError('msgArea', 'La hora de inicio debe ser antes que la hora de fin.');
    return;
  }
  bloquesActuales.push({ dia, inicio, fin });
  await guardarHorario(perfilActual.personaId, bloquesActuales);
  renderTablaBloques();
  cargarSemana();
  mostrarOk('msgArea', 'Bloque agregado a tu horario.');
});

/* ---------- Fechas ---------- */
function lunesDeSemana(offset) {
  const hoy = new Date();
  const dia = hoy.getDay();
  const diffAlLunes = (dia === 0 ? -6 : 1 - dia);
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diffAlLunes + offset * 7);
  lunes.setHours(0,0,0,0);
  return lunes;
}
function formatoFecha(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function formatoCorto(d) { return d.toLocaleDateString('es-CO', { day:'2-digit', month:'short' }); }
function formatoLargo(d) { return d.toLocaleDateString('es-CO', { weekday:'long', day:'2-digit', month:'long' }); }

const grid = document.getElementById('grid');
const rangoSemanaEl = document.getElementById('rangoSemana');

document.getElementById('btnPrev').addEventListener('click', () => { if (offsetSemanas>0){offsetSemanas--; cargarSemana();} });
document.getElementById('btnNext').addEventListener('click', () => { offsetSemanas++; cargarSemana(); });

async function cargarSemana() {
  document.getElementById('btnPrev').disabled = offsetSemanas === 0;
  const lunes = lunesDeSemana(offsetSemanas);
  const viernes = new Date(lunes); viernes.setDate(lunes.getDate()+4);
  rangoSemanaEl.textContent = `${formatoCorto(lunes)} — ${formatoCorto(viernes)} de ${viernes.getFullYear()}`;

  const citasMap = {};
  const bloqueosMap = {};

  const [citasSnap, bloqueosSnap] = await Promise.all([
    db.collection('citas').where('personaId','==',perfilActual.personaId)
      .where('fecha','>=',formatoFecha(lunes)).where('fecha','<=',formatoFecha(viernes)).get(),
    db.collection('bloqueos').where('personaId','==',perfilActual.personaId)
      .where('fecha','>=',formatoFecha(lunes)).where('fecha','<=',formatoFecha(viernes)).get()
  ]);
  citasSnap.forEach(doc => { const c = doc.data(); citasMap[`${c.fecha}_${c.hora}`] = c; });
  bloqueosSnap.forEach(doc => { const b = doc.data(); bloqueosMap[`${b.fecha}_${b.hora}`] = doc.id; });

  renderColumnas(lunes, citasMap, bloqueosMap);
}

function renderColumnas(lunes, citasMap, bloqueosMap) {
  grid.innerHTML = '';
  const ahora = new Date();
  let diasConHorario = 0;

  for (let i = 0; i < 5; i++) {
    const d = new Date(lunes); d.setDate(lunes.getDate() + i);
    const fechaStr = formatoFecha(d);
    const slots = generarSlotsDelDia(bloquesActuales, i);
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

      if (citasMap[clave]) {
        const c = citasMap[clave];
        btn.className = 'slot-btn ocupado';
        btn.textContent = `${etiqueta} · Cita`;
        btn.addEventListener('click', () => verDetalleCita(c));
      } else if (bloqueosMap[clave]) {
        btn.className = 'slot-btn bloqueado';
        btn.textContent = `${etiqueta} · Bloqueado`;
        btn.addEventListener('click', () => desbloquear(bloqueosMap[clave]));
      } else if (esPasado) {
        btn.className = 'slot-btn pasado';
        btn.textContent = etiqueta;
      } else {
        btn.className = 'slot-btn';
        btn.textContent = `${etiqueta} · Libre`;
        btn.addEventListener('click', () => bloquear(fechaStr, horaStr));
      }
      lista.appendChild(btn);
    });
    col.appendChild(lista);
    grid.appendChild(col);
  }

  if (diasConHorario === 0) {
    grid.innerHTML = '<p style="color:var(--texto-suave); padding:20px;">No tienes ningún horario configurado todavía. Agrégalo en "Mi horario de atención" arriba.</p>';
  }
}

async function bloquear(fecha, hora) {
  try {
    await db.collection('bloqueos').add({ personaId: perfilActual.personaId, fecha, hora });
    cargarSemana();
  } catch (e) { console.error(e); mostrarError('msgArea','No se pudo bloquear ese espacio.'); }
}
async function desbloquear(idDoc) {
  try {
    await db.collection('bloqueos').doc(idDoc).delete();
    cargarSemana();
  } catch (e) { console.error(e); mostrarError('msgArea','No se pudo desbloquear ese espacio.'); }
}

/* ---------- Detalle de una cita ---------- */
function verDetalleCita(c) {
  const modal = document.getElementById('modalDetalleCita');
  document.getElementById('detalleCitaFecha').textContent = `${c.fecha} — ${c.hora}`;
  document.getElementById('detalleCitaContenido').innerHTML = `
    <div class="cita-item"><span>Representante</span><span>${c.representante || '—'}</span></div>
    <div class="cita-item"><span>Teléfono</span><span class="mono">${c.telefono || '—'}</span></div>
    <div class="cita-item"><span>Estudiante</span><span>${c.estudiante || '—'}</span></div>
    <div class="cita-item"><span>Grado y sección</span><span>${c.grado || '—'} ${c.seccion || ''}</span></div>
    <div class="cita-item" style="display:block;"><span style="display:block; margin-bottom:6px;">Motivo</span><span style="display:block; color:var(--texto-suave);">${c.motivo || 'No se especificó un motivo.'}</span></div>
  `;
  modal.classList.add('open');
}
document.getElementById('cerrarDetalleCita').addEventListener('click', () => {
  document.getElementById('modalDetalleCita').classList.remove('open');
});
document.getElementById('modalDetalleCita').addEventListener('click', (e) => {
  if (e.target.id === 'modalDetalleCita') e.currentTarget.classList.remove('open');
});

/* ---------- Vista anual de mis citas reales ---------- */
const anio = new Date().getFullYear();
const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const diasCorto = ['L','M','M','J','V','S','D'];

async function cargarAnio() {
  document.getElementById('tituloAnio').textContent = `Mis citas — ${anio}`;
  const anioGrid = document.getElementById('anioGrid');
  anioGrid.innerHTML = '<p>Cargando...</p>';
  const citasPorFecha = {};
  const snap = await db.collection('citas')
    .where('personaId','==',perfilActual.personaId)
    .where('fecha','>=',`${anio}-01-01`).where('fecha','<=',`${anio}-12-31`).get();
  snap.forEach(doc => {
    const c = doc.data();
    if (!citasPorFecha[c.fecha]) citasPorFecha[c.fecha] = [];
    citasPorFecha[c.fecha].push(c);
  });
  renderAnio(citasPorFecha);
}

function renderAnio(citasPorFecha) {
  const anioGrid = document.getElementById('anioGrid');
  anioGrid.innerHTML = '';
  const mesActual = new Date().getMonth();
  for (let m=mesActual;m<12;m++){
    const primerDia = new Date(anio,m,1);
    const totalDias = new Date(anio,m+1,0).getDate();
    const offset = (primerDia.getDay()+6)%7;
    const mesDiv = document.createElement('div'); mesDiv.className='mes';
    mesDiv.innerHTML = `<h4>${meses[m]}</h4>`;
    const diasDiv = document.createElement('div'); diasDiv.className='dias-mes';
    diasCorto.forEach(d=>{ const el=document.createElement('div'); el.className='dow'; el.textContent=d; diasDiv.appendChild(el); });
    for (let i=0;i<offset;i++){ const el=document.createElement('div'); el.className='dia vacio'; diasDiv.appendChild(el); }
    for (let d=1; d<=totalDias; d++){
      const fechaStr = `${anio}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const el = document.createElement('div'); el.className='dia';
      el.textContent = d;
      el.style.cursor = 'pointer';
      if (citasPorFecha[fechaStr]) el.classList.add('con-cita');
      el.addEventListener('click', () => irADia(fechaStr, citasPorFecha[fechaStr]));
      diasDiv.appendChild(el);
    }
    mesDiv.appendChild(diasDiv);
    anioGrid.appendChild(mesDiv);
  }
}

function irADia(fechaStr, citasDelDia) {
  const [y,m,d] = fechaStr.split('-').map(Number);
  const fecha = new Date(y, m-1, d);
  const lunesDeEsa = new Date(fecha);
  const dia = lunesDeEsa.getDay();
  lunesDeEsa.setDate(lunesDeEsa.getDate() + (dia === 0 ? -6 : 1-dia));
  lunesDeEsa.setHours(0,0,0,0);

  const lunesActual = lunesDeSemana(0);
  const diffDias = Math.round((lunesDeEsa - lunesActual) / 86400000);
  offsetSemanas = Math.round(diffDias / 7);
  if (offsetSemanas < 0) offsetSemanas = 0;

  cargarSemana().then(() => {
    document.querySelectorAll('.panel-box')[1].scrollIntoView({ behavior:'smooth', block:'start' });
  });

  if (citasDelDia && citasDelDia.length) mostrarCitasDelDia(fechaStr, citasDelDia);
}

function mostrarCitasDelDia(fechaStr, citas) {
  citas.sort((a,b)=> a.hora.localeCompare(b.hora));
  document.getElementById('popoverTitulo').textContent = `Citas del ${fechaStr}`;
  document.getElementById('popoverLista').innerHTML = citas.map(c => `
    <div class="cita-item" style="cursor:pointer;">
      <span><strong>${c.hora}</strong> — ${c.representante || ''}</span>
      <span class="mono">${c.telefono || ''}</span>
    </div>`).join('');
  document.querySelectorAll('#popoverLista .cita-item').forEach((el, i) => {
    el.addEventListener('click', () => verDetalleCita(citas[i]));
  });
  const pop = document.getElementById('popover');
  pop.classList.add('open');
}

/* ---------- Lista simple de próximas citas ---------- */
async function cargarProximasCitas() {
  const cont = document.getElementById('listaProximasCitas');
  const hoy = formatoFecha(new Date());
  const snap = await db.collection('citas')
    .where('personaId','==',perfilActual.personaId)
    .where('fecha','>=',hoy)
    .get();

  const citas = [];
  snap.forEach(doc => citas.push(doc.data()));
  citas.sort((a,b) => a.fecha === b.fecha ? a.hora.localeCompare(b.hora) : a.fecha.localeCompare(b.fecha));

  if (citas.length === 0) {
    cont.innerHTML = '<p style="color:var(--texto-suave);">No hay citas agendadas.</p>';
    return;
  }

  cont.innerHTML = citas.map(c => {
    const [y,m,d] = c.fecha.split('-').map(Number);
    const fechaObj = new Date(y, m-1, d);
    return `
      <div class="cita-item" style="cursor:pointer;" data-fecha="${c.fecha}" data-hora="${c.hora}">
        <span><strong>${formatoLargo(fechaObj)}</strong> — ${c.hora} — ${c.representante || ''} (${c.estudiante || ''})</span>
        <span class="mono">${c.telefono || ''}</span>
      </div>`;
  }).join('');

  cont.querySelectorAll('.cita-item').forEach((el, i) => {
    el.addEventListener('click', () => verDetalleCita(citas[i]));
  });
}
