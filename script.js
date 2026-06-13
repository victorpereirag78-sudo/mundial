/* =============================================
   MUNDIAL 2026 — APUESTA AMISTOSA
   script.js — Con Supabase como backend
   Todos los participantes desde cualquier
   dispositivo comparten la misma base de datos.
============================================= */

'use strict';

/* ==============================
   CONFIGURACIÓN SUPABASE
   Reemplaza con tus credenciales
============================== */
const SUPABASE_URL  = 'https://myexgkklwojztbglqtiq.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15ZXhna2tsd29qenRiZ2xxdGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MjQyMTgsImV4cCI6MjA5NDIwMDIxOH0.E-GNUsmFVGvp-J6o12DlbpdhAfHP00cHx-Qy1yua0NY';

/* Helper fetch para Supabase REST API */
const sb = {
  /* GET: query con filtros opcionales */
  async get(tabla, params = '') {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${tabla}?${params}`, {
      headers: {
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      }
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  /* POST: insertar registro */
  async post(tabla, datos) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${tabla}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(datos)
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  /* PATCH: actualizar registro */
  async patch(tabla, filtro, datos) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${tabla}?${filtro}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(datos)
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  /* DELETE: eliminar registro */
  async delete(tabla, filtro) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${tabla}?${filtro}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Content-Type': 'application/json',
      },
    });
    if (!r.ok) throw new Error(await r.text());
    return true;
  },
};

/* ---- 48 SELECCIONES CLASIFICADAS AL MUNDIAL 2026 ---- */
const PAISES = [
  { nombre: "Alemania" },
  { nombre: "Argelia" },
  { nombre: "Arabia Saudita" },
  { nombre: "Argentina" },
  { nombre: "Australia" },
  { nombre: "Austria" },
  { nombre: "Bélgica" },
  { nombre: "Bosnia y Herzegovina" },
  { nombre: "Brasil" },
  { nombre: "Cabo Verde" },
  { nombre: "Canadá" },
  { nombre: "Catar" },
  { nombre: "Colombia" },
  { nombre: "Corea del Sur" },
  { nombre: "Costa de Marfil" },
  { nombre: "Croacia" },
  { nombre: "Curazao" },
  { nombre: "Ecuador" },
  { nombre: "Egipto" },
  { nombre: "Escocia" },
  { nombre: "España" },
  { nombre: "Estados Unidos" },
  { nombre: "Francia" },
  { nombre: "Ghana" },
  { nombre: "Haití" },
  { nombre: "Inglaterra" },
  { nombre: "Irán" },
  { nombre: "Irak" },
  { nombre: "Japón" },
  { nombre: "Jordania" },
  { nombre: "Marruecos" },
  { nombre: "México" },
  { nombre: "Noruega" },
  { nombre: "Nueva Zelanda" },
  { nombre: "Países Bajos" },
  { nombre: "Panamá" },
  { nombre: "Paraguay" },
  { nombre: "Portugal" },
  { nombre: "República Checa" },
  { nombre: "República Democrática del Congo" },
  { nombre: "Senegal" },
  { nombre: "Sudáfrica" },
  { nombre: "Suecia" },
  { nombre: "Suiza" },
  { nombre: "Túnez" },
  { nombre: "Turquía" },
  { nombre: "Uruguay" },
  { nombre: "Uzbekistán" },
];

/* ---- ESTADO GLOBAL ---- */
let participantes   = [];   // cache local de participantes
let ordenAscendente = true;
let audioCtx        = null;
let cargando        = false;

/* ==============================
   INICIALIZACIÓN
============================== */
document.addEventListener('DOMContentLoaded', async () => {
  aplicarTemaGuardado();
  poblarSelects();
  iniciarCountdown();
  verificarAdminGuardado();
  await cargarTodo();
});

/* ==============================
   CARGA INICIAL DESDE SUPABASE
============================== */
async function cargarTodo() {
  mostrarLoader(true);
  try {
    // Cargar participantes (máx 1000, con paginación si se necesita)
    const rows = await sb.get(
      'mundial_participantes',
      'order=fecha.asc&limit=1000&select=id,nombre,sel1,sel2,sel3,fecha'
    );
    participantes = rows.map(r => ({
      ...r,
      fecha: r.fecha
        ? new Date(r.fecha).toLocaleDateString('es-CL', { day:'2-digit', month:'2-digit', year:'numeric' })
        : '—'
    }));

    // Cargar campeón guardado
    const cfg = await sb.get('mundial_config', 'clave=eq.campeon&select=valor');
    const campeon = cfg?.[0]?.valor || '';
    if (campeon) localStorage.setItem('mundial_campeon_cache', campeon);
    else         localStorage.removeItem('mundial_campeon_cache');

  } catch (e) {
    console.error('Error cargando datos:', e);
    mostrarAlert('⚠️ No se pudo conectar a Supabase. Verifica las credenciales en script.js', 'danger');
  } finally {
    mostrarLoader(false);
    renderDashboard();
    renderTabla();
    renderEstadisticas();
    renderResultadoPublico();
    renderPosiciones();
    poblarSelectsCampeon();
  }
}

/* ==============================
   LOADER
============================== */
function mostrarLoader(estado) {
  cargando = estado;
  let el = document.getElementById('globalLoader');
  if (!el) {
    el = document.createElement('div');
    el.id = 'globalLoader';
    el.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'height:3px',
      'background:var(--gold)', 'z-index:9999',
      'transition:opacity 0.3s',
      'animation: loadbar 1.2s ease-in-out infinite alternate'
    ].join(';');
    const style = document.createElement('style');
    style.textContent = '@keyframes loadbar { from{transform:scaleX(0.1);transform-origin:left} to{transform:scaleX(1);transform-origin:left} }';
    document.head.appendChild(style);
    document.body.appendChild(el);
  }
  el.style.opacity = estado ? '1' : '0';
}

function mostrarAlert(msg, tipo = 'info') {
  let el = document.getElementById('globalAlert');
  if (!el) {
    el = document.createElement('div');
    el.id = 'globalAlert';
    el.style.cssText = 'position:fixed;top:16px;right:16px;z-index:9998;max-width:340px;padding:12px 16px;border-radius:8px;font-size:13px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.4);cursor:pointer';
    el.onclick = () => el.style.display = 'none';
    document.body.appendChild(el);
  }
  el.style.background = tipo === 'danger' ? '#c0392b' : tipo === 'ok' ? '#27ae60' : '#c9a227';
  el.style.color = '#fff';
  el.style.display = 'block';
  el.textContent = msg;
  setTimeout(() => { el.style.display = 'none'; }, 5000);
}

/* ==============================
   NAVEGACIÓN
============================== */
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const target = document.getElementById('sec-' + id);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-link').forEach(l => {
    if (l.getAttribute('onclick')?.includes(id)) l.classList.add('active');
  });

  if (id === 'dashboard')   renderDashboard();
  if (id === 'estadisticas') renderEstadisticas();
  if (id === 'posiciones')  renderPosiciones();
  if (id === 'resultado')   { renderResultadoPublico(); poblarSelectsCampeon(); }
  if (id === 'simulador')   poblarSelectSimulador();
  if (id === 'admin')       renderLog();

  if (window.innerWidth <= 720)
    document.getElementById('sidebar').classList.remove('open');

  return false;
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

/* ==============================
   SELECTS
============================== */
function poblarSelects() {
  ['pSel1', 'pSel2', 'pSel3'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '<option value="">— Elige país —</option>';
    PAISES.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.nombre;
      opt.textContent = p.nombre;
      el.appendChild(opt);
    });
  });
}

function poblarSelectsCampeon() {
  const usados = new Set();
  participantes.forEach(p => {
    if (p.sel1) usados.add(p.sel1);
    if (p.sel2) usados.add(p.sel2);
    if (p.sel3) usados.add(p.sel3);
  });

  const campeonActual = getCampeonCache();
  const el = document.getElementById('selCampeon');
  if (!el) return;
  el.innerHTML = '<option value="">— Seleccionar campeón —</option>';
  [...usados].sort().forEach(nombre => {
    const opt = document.createElement('option');
    opt.value = nombre;
    opt.textContent = nombre;
    if (nombre === campeonActual) opt.selected = true;
    el.appendChild(opt);
  });
}

function poblarSelectSimulador() {
  const usados = new Set();
  participantes.forEach(p => {
    if (p.sel1) usados.add(p.sel1);
    if (p.sel2) usados.add(p.sel2);
    if (p.sel3) usados.add(p.sel3);
  });
  const el = document.getElementById('selSimulador');
  el.innerHTML = '<option value="">— Seleccionar país —</option>';
  [...usados].sort().forEach(nombre => {
    const opt = document.createElement('option');
    opt.value = nombre;
    opt.textContent = nombre;
    el.appendChild(opt);
  });
}

function updateSelects() {
  const v1 = document.getElementById('pSel1').value;
  const v2 = document.getElementById('pSel2').value;
  ['pSel2', 'pSel3'].forEach(id => {
    [...document.getElementById(id).options].forEach(o => o.disabled = false);
  });
  if (v1) {
    [...document.getElementById('pSel2').options].forEach(o => { if (o.value === v1) o.disabled = true; });
  }
  [...document.getElementById('pSel3').options].forEach(o => {
    if ((v1 && o.value === v1) || (v2 && o.value === v2)) o.disabled = true;
  });
}

/* ==============================
   CAMPEON CACHE
============================== */
function getCampeonCache() {
  return localStorage.getItem('mundial_campeon_cache') || '';
}

async function setCampeonDB(nombre) {
  await sb.patch('mundial_config', 'clave=eq.campeon', { valor: nombre });
  localStorage.setItem('mundial_campeon_cache', nombre);
}

/* ==============================
   CRUD PARTICIPANTES
============================== */
async function guardarParticipante() {
  const nombre = document.getElementById('pNombre').value.trim();
  const sel1   = document.getElementById('pSel1').value;
  const sel2   = document.getElementById('pSel2').value;
  const sel3   = document.getElementById('pSel3').value;
  const editId = document.getElementById('editIndex').value; // UUID o vacío
  const errEl  = document.getElementById('formError');

  if (!nombre)   return showError(errEl, 'El nombre es obligatorio.');
  if (!sel1)     return showError(errEl, 'Debes elegir al menos la Selección N°1.');

  const sels = [sel1, sel2, sel3].filter(Boolean);
  if (new Set(sels).size !== sels.length)
    return showError(errEl, 'No puedes repetir selecciones dentro del mismo participante.');

  const duplicado = participantes.find(p =>
    p.nombre.toLowerCase() === nombre.toLowerCase() && p.id !== editId
  );
  if (duplicado) return showError(errEl, `Ya existe un participante con el nombre "${nombre}".`);

  errEl.classList.add('hidden');
  mostrarLoader(true);

  try {
    if (editId) {
      // EDITAR: PATCH en Supabase
      await sb.patch('mundial_participantes', `id=eq.${editId}`, {
        nombre, sel1, sel2: sel2 || null, sel3: sel3 || null
      });
      addLog(`Editado: ${nombre}`);
      mostrarAlert('✅ Participante actualizado', 'ok');
    } else {
      // INSERTAR
      await sb.post('mundial_participantes', {
        nombre, sel1, sel2: sel2 || null, sel3: sel3 || null
      });
      addLog(`Inscrito: ${nombre}`);
      mostrarAlert('✅ ¡Inscripción exitosa!', 'ok');
    }

    cancelarEdicion();
    await cargarTodo();

  } catch (e) {
    mostrarAlert('❌ Error al guardar: ' + e.message, 'danger');
  } finally {
    mostrarLoader(false);
  }
}

async function editarParticipante(id) {
  const p = participantes.find(x => x.id === id);
  if (!p) return;

  document.getElementById('pNombre').value   = p.nombre;
  document.getElementById('editIndex').value = p.id;
  document.getElementById('formTitle').textContent = '✏️ Editar Participante';

  poblarSelects();
  document.getElementById('pSel1').value = p.sel1 || '';
  document.getElementById('pSel2').value = p.sel2 || '';
  document.getElementById('pSel3').value = p.sel3 || '';
  updateSelects();

  document.getElementById('pNombre').scrollIntoView({ behavior: 'smooth', block: 'center' });
  document.getElementById('pNombre').focus();
}

async function eliminarParticipante(id) {
  const p = participantes.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`¿Eliminar a "${p.nombre}" de la apuesta?`)) return;

  mostrarLoader(true);
  try {
    await sb.delete('mundial_participantes', `id=eq.${id}`);
    addLog(`Eliminado: ${p.nombre}`);
    mostrarAlert('🗑 Participante eliminado', 'info');
    await cargarTodo();
  } catch (e) {
    mostrarAlert('❌ Error al eliminar: ' + e.message, 'danger');
  } finally {
    mostrarLoader(false);
  }
}

function cancelarEdicion() {
  document.getElementById('pNombre').value   = '';
  document.getElementById('pSel1').value     = '';
  document.getElementById('pSel2').value     = '';
  document.getElementById('pSel3').value     = '';
  document.getElementById('editIndex').value = '';
  document.getElementById('formTitle').textContent = '➕ Nuevo Participante';
  document.getElementById('formError').classList.add('hidden');
  poblarSelects();
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

/* ==============================
   RENDER TABLA
============================== */
function renderTabla() {
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const body   = document.getElementById('tablaBody');
  if (!body) return;

  const filtrados = participantes.filter(p =>
    p.nombre.toLowerCase().includes(search)
  );

  if (filtrados.length === 0) {
    body.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">
      ${search ? 'Sin resultados para "' + search + '"' : 'No hay participantes aún. ¡Sé el primero en inscribirte!'}
    </td></tr>`;
  } else {
    body.innerHTML = filtrados.map((p, fi) => `<tr>
      <td>${fi + 1}</td>
      <td><strong>${p.nombre}</strong></td>
      <td>${p.sel1 || '—'}</td>
      <td>${p.sel2 || '—'}</td>
      <td>${p.sel3 || '—'}</td>
      <td style="color:var(--text-muted);font-size:12px">${p.fecha || '—'}</td>
      <td>
        <button onclick="editarParticipante('${p.id}')" class="btn btn-ghost btn-sm">✏️</button>
        <button onclick="eliminarParticipante('${p.id}')" class="btn btn-danger btn-sm">🗑</button>
      </td>
    </tr>`).join('');
  }

  document.getElementById('totalLabel').textContent =
    `${participantes.length} participante${participantes.length !== 1 ? 's' : ''}`;
}

function ordenarAlfabetico() {
  participantes.sort((a, b) => ordenAscendente
    ? a.nombre.localeCompare(b.nombre)
    : b.nombre.localeCompare(a.nombre));
  ordenAscendente = !ordenAscendente;
  renderTabla();
}

/* ==============================
   DASHBOARD
============================== */
function renderDashboard() {
  document.getElementById('dash-total').textContent = participantes.length;

  const conteo = contarTotal();
  const sels   = Object.entries(conteo).sort((a, b) => b[1] - a[1]);

  if (sels.length > 0) {
    document.getElementById('dash-mas').textContent   = sels[0][0];
    document.getElementById('dash-menos').textContent = sels[sels.length - 1][0];
  } else {
    document.getElementById('dash-mas').textContent   = '—';
    document.getElementById('dash-menos').textContent = '—';
  }

  document.getElementById('dash-distintas').textContent = sels.length;

  const ultima = participantes.length > 0 ? participantes[participantes.length - 1].fecha : '—';
  document.getElementById('dash-ultima').textContent = ultima;

  // Top 5
  const top5El    = document.getElementById('top5');
  const totalVtos = (participantes.length * 3) || 1;
  if (sels.length === 0) {
    top5El.innerHTML = '<p class="muted">Sin datos aún.</p>';
  } else {
    top5El.innerHTML = sels.slice(0, 5).map(([nombre, n], i) => {
      const pct = Math.round((n / totalVtos) * 100);
      return `<div class="top5-item">
        <div class="top5-pos">${i + 1}</div>
        <div><div>${nombre}</div><div class="top5-pct">${n} votos — ${pct}%</div></div>
      </div>`;
    }).join('');
  }

  // Probabilidades basadas en 1ª opción
  const c1    = contarPorOpcion(1);
  const items = Object.entries(c1).sort((a, b) => b[1] - a[1]);
  const tot1  = participantes.length || 1;
  const probEl = document.getElementById('probabilidades');

  if (items.length === 0) {
    probEl.innerHTML = '<p class="muted">Sin datos aún.</p>';
  } else {
    probEl.innerHTML = items.slice(0, 10).map(([nombre, n]) => {
      const pct = Math.round((n / tot1) * 100);
      return `<div class="prob-item">
        <div class="prob-name">${nombre}</div>
        <div class="prob-bar-wrap">
          <div class="prob-bar"><div class="prob-bar-fill" style="width:${pct}%"></div></div>
        </div>
        <div class="prob-pct">${pct}%</div>
      </div>`;
    }).join('');
  }
}

/* ==============================
   ESTADÍSTICAS
============================== */
function contarPorOpcion(opcion) {
  const key = 'sel' + opcion;
  const mapa = {};
  participantes.forEach(p => { if (p[key]) mapa[p[key]] = (mapa[p[key]] || 0) + 1; });
  return mapa;
}

function contarTotal() {
  const mapa = {};
  participantes.forEach(p => {
    ['sel1','sel2','sel3'].forEach(k => { if (p[k]) mapa[p[k]] = (mapa[p[k]] || 0) + 1; });
  });
  return mapa;
}

function renderEstadisticas() {
  const c1       = contarPorOpcion(1);
  const cT       = contarTotal();
  const sorted1  = Object.entries(c1).sort((a, b) => b[1] - a[1]);
  const sortedT  = Object.entries(cT).sort((a, b) => b[1] - a[1]);
  const tot      = participantes.length || 1;
  const totVotos = (participantes.length * 3) || 1;
  const medals   = ['gold-medal','silver-medal','bronze-medal'];

  // Ranking 1ª opción
  const r1 = document.getElementById('rankingPrimera');
  r1.innerHTML = sorted1.length === 0 ? '<p class="muted">Sin datos.</p>' :
    sorted1.map(([nombre, n], i) => {
      const pct = Math.round((n / tot) * 100);
      return `<div class="ranking-item">
        <div class="rank-num ${medals[i]||''}">${i+1}</div>
        <div class="rank-bar-wrap">
          <div class="rank-label">${nombre}</div>
          <div class="rank-bar"><div class="rank-bar-fill" style="width:${pct}%"></div></div>
        </div>
        <div class="rank-count">${n}</div>
        <div class="rank-pct">${pct}%</div>
      </div>`;
    }).join('');

  // Ranking total
  const rT = document.getElementById('rankingTotal');
  rT.innerHTML = sortedT.length === 0 ? '<p class="muted">Sin datos.</p>' :
    sortedT.map(([nombre, n], i) => {
      const pct = Math.round((n / totVotos) * 100);
      return `<div class="ranking-item">
        <div class="rank-num ${medals[i]||''}">${i+1}</div>
        <div class="rank-bar-wrap">
          <div class="rank-label">${nombre}</div>
          <div class="rank-bar"><div class="rank-bar-fill" style="width:${pct}%"></div></div>
        </div>
        <div class="rank-count">${n}</div>
        <div class="rank-pct">${pct}%</div>
      </div>`;
    }).join('');

  // Gráfico
  renderBarChart(sortedT.slice(0, 12));

  // Tabla por selección
  const pps = document.getElementById('porSeleccion');
  const c2  = contarPorOpcion(2);
  const c3  = contarPorOpcion(3);
  pps.innerHTML = sortedT.length === 0 ? '<p class="muted">Sin datos.</p>' :
    `<div class="table-wrap"><table class="data-table">
      <thead><tr><th>Selección</th><th>1ª</th><th>2ª</th><th>3ª</th><th>Total</th><th>%</th></tr></thead>
      <tbody>` +
    sortedT.map(([nombre, total]) => {
      const pct = Math.round((total / totVotos) * 100);
      return `<tr>
        <td>${nombre}</td>
        <td>${c1[nombre]||0}</td><td>${c2[nombre]||0}</td><td>${c3[nombre]||0}</td>
        <td><strong>${total}</strong></td><td>${pct}%</td>
      </tr>`;
    }).join('') +
    `</tbody></table></div>`;
}

/* ---- GRÁFICO CANVAS ---- */
function renderBarChart(datos) {
  const canvas = document.getElementById('barChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W   = canvas.parentElement.clientWidth || 600;
  const H   = 220;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  if (datos.length === 0) {
    ctx.fillStyle = '#7aaa8e'; ctx.font = '14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Sin datos aún', W / 2, H / 2);
    return;
  }

  const n      = datos.length;
  const maxVal = Math.max(...datos.map(d => d[1]));
  const pad    = { top: 16, bottom: 56, left: 10, right: 10 };
  const barW   = Math.floor((W - pad.left - pad.right) / n) - 4;
  const chartH = H - pad.top - pad.bottom;
  const colors = ['#c9a227','#b8942a','#e8be45','#27ae60','#1a7a44','#f0c040','#2ecc71','#c0a020','#45b878','#d4a030','#3ab870','#b09020'];

  datos.forEach(([nombre, val], i) => {
    const barH = Math.max(4, Math.round((val / maxVal) * chartH));
    const x    = pad.left + i * (barW + 4);
    const y    = pad.top + chartH - barH;

    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, barW, barH, [4,4,0,0]);
    else ctx.rect(x, y, barW, barH);
    ctx.fill();

    ctx.fillStyle = '#f0ece0';
    ctx.font = `bold ${Math.min(13, barW * 0.6)}px Inter`;
    ctx.textAlign = 'center';
    ctx.fillText(val, x + barW / 2, y - 4);

    ctx.fillStyle = '#7aaa8e';
    ctx.font = `${Math.min(11, barW * 0.5)}px Inter`;
    ctx.save();
    ctx.translate(x + barW / 2, H - pad.bottom + 14);
    ctx.rotate(-0.6);
    const label = nombre.length > 7 ? nombre.substring(0, 7) + '.' : nombre;
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });
}

/* ==============================
   LÓGICA DE GANADORES
============================== */
function calcularGanadores(campeon) {
  if (!campeon || participantes.length === 0) return null;

  for (let ronda = 1; ronda <= 3; ronda++) {
    const candidatos = participantes.filter(p => p['sel' + ronda] === campeon);
    if (candidatos.length === 0) continue;
    if (candidatos.length < 3) {
      return {
        ganadores: candidatos, campeon, ronda, empate: false,
        motivo: `${candidatos.length} participante${candidatos.length > 1 ? 's eligieron' : ' eligió'} ${campeon} como opción N°${ronda} (menos de 3).`
      };
    }
  }

  const todos = participantes.filter(p => p.sel1 === campeon || p.sel2 === campeon || p.sel3 === campeon);
  return {
    ganadores: todos, campeon, ronda: 3, empate: true,
    motivo: `En las 3 rondas hubo 3 o más coincidencias con ${campeon}. Empate total.`
  };
}

function htmlResultado(resultado) {
  if (!resultado) return '<p class="muted">Sin datos suficientes.</p>';

  if (resultado.empate) {
    return `<div class="resultado-ganadores">
      <h3>${resultado.campeon} — EMPATE FINAL</h3>
      <div class="ganador-empate">🤝 ${resultado.ganadores.length} participante${resultado.ganadores.length > 1 ? 's' : ''} comparten la victoria.</div>
      ${resultado.ganadores.map(g => `<div class="ganador-item">🥇 ${g.nombre}</div>`).join('')}
      <div class="resultado-meta">📋 ${resultado.motivo}</div>
    </div>`;
  }

  return `<div class="resultado-ganadores">
    <h3>${resultado.campeon} — Campeón del Mundo</h3>
    <p style="margin-bottom:10px;color:var(--text-muted)">🏅 Ganador${resultado.ganadores.length > 1 ? 'es' : ''} — Ronda ${resultado.ronda}:</p>
    ${resultado.ganadores.map(g => `<div class="ganador-item">🥇 ${g.nombre}
      <span style="color:var(--text-muted);font-size:11px">(Sel.${resultado.ronda}: ${g['sel'+resultado.ronda]})</span>
    </div>`).join('')}
    <div class="resultado-meta">📋 ${resultado.motivo}</div>
  </div>`;
}

/* ==============================
   DEFINIR CAMPEÓN (Admin)
============================== */
async function definirCampeon(esSimulacion = false) {
  const selectId   = esSimulacion ? 'selSimulador' : 'selCampeon';
  const resultElId = esSimulacion ? 'resultadoSimulacion' : 'resultadoOficial';
  const campeon    = document.getElementById(selectId).value;

  if (!campeon) { alert('Selecciona una selección primero.'); return; }

  const resultado = calcularGanadores(campeon);
  document.getElementById(resultElId).innerHTML = htmlResultado(resultado);

  if (!esSimulacion) {
    mostrarLoader(true);
    try {
      await setCampeonDB(campeon);
      addLog(`Campeón definido: ${campeon}`);
      renderResultadoPublico();
      renderPosiciones();
      mostrarGanador(resultado);
    } catch (e) {
      mostrarAlert('❌ Error guardando campeón: ' + e.message, 'danger');
    } finally {
      mostrarLoader(false);
    }
  }
}

function renderResultadoPublico() {
  const campeon = getCampeonCache();
  const el = document.getElementById('resultadoPublico');
  if (!el) return;
  if (!campeon) {
    el.innerHTML = '<p class="muted">El torneo aún no tiene un campeón definido.</p>';
    return;
  }
  el.innerHTML = htmlResultado(calcularGanadores(campeon));
}

function renderPosiciones() {
  const campeon = getCampeonCache();
  const el = document.getElementById('tablaPosiciones');
  if (!el) return;
  if (!campeon) { el.innerHTML = '<p class="muted">Define el campeón para ver la tabla de posiciones.</p>'; return; }

  const resultado = calcularGanadores(campeon);
  if (!resultado) { el.innerHTML = '<p class="muted">Sin datos suficientes.</p>'; return; }

  const ganadorSet = new Set(resultado.ganadores.map(g => g.id));
  const filas = [
    ...resultado.ganadores.map(g => ({ ...g, ganador: true, selGanadora: g['sel'+resultado.ronda] })),
    ...participantes.filter(p => !ganadorSet.has(p.id)).map(p => ({ ...p, ganador: false, selGanadora: '—' }))
  ];

  el.innerHTML = `
    <div style="margin-bottom:14px;padding:12px;background:rgba(201,162,39,0.1);border:1px solid var(--gold-dim);border-radius:8px;">
      <strong>Campeón: ${campeon}</strong>
      ${resultado.empate ? ' — Empate final' : ` — Definido en Ronda ${resultado.ronda}`}
    </div>
    <div class="table-wrap"><table class="pos-table">
      <thead><tr><th>Puesto</th><th>Nombre</th><th>Sel. Ganadora</th><th>Estado</th></tr></thead>
      <tbody>${filas.map((f, i) => {
        const cls = i===0?'pos-1':i===1?'pos-2':i===2?'pos-3':'';
        return `<tr class="${cls}">
          <td>${f.ganador ? (i+1)+'°' : '—'}</td>
          <td><strong>${f.nombre}</strong></td>
          <td>${f.selGanadora}</td>
          <td>${f.ganador ? '<span style="color:#27ae60;font-weight:700">🏆 Ganador</span>' : '<span style="color:var(--text-muted)">—</span>'}</td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>`;
}

function simular() {
  const campeon = document.getElementById('selSimulador').value;
  if (!campeon) { alert('Selecciona una selección para simular.'); return; }
  document.getElementById('resultadoSimulacion').innerHTML =
    `<div style="margin-bottom:10px;font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">
      ⚠️ Simulación — no afecta el resultado oficial</div>` +
    htmlResultado(calcularGanadores(campeon));
}

/* ==============================
   OVERLAY GANADOR + CONFETI
============================== */
function mostrarGanador(resultado) {
  const overlay   = document.getElementById('ganadorOverlay');
  const contenido = document.getElementById('ganadorContenido');
  const titulo    = document.getElementById('ganadorTitulo');

  titulo.textContent = resultado.empate ? '¡EMPATE TOTAL!' : resultado.campeon.toUpperCase();
  contenido.innerHTML = resultado.ganadores.map(g =>
    `<div class="ganador-item" style="justify-content:center">🥇 ${g.nombre}</div>`
  ).join('');

  overlay.classList.remove('hidden');
  lanzarConfeti();
  reproducirSonidoEstadio();
}

function cerrarGanador() {
  document.getElementById('ganadorOverlay').classList.add('hidden');
  pararConfeti();
}

/* ---- CONFETI ---- */
let confettiAnim = null;

function lanzarConfeti() {
  const canvas = document.getElementById('confettiCanvas');
  const ctx    = canvas.getContext('2d');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const colores = ['#c9a227','#27ae60','#e74c3c','#3498db','#f39c12','#9b59b6','#e8be45'];
  const prt = Array.from({ length: 150 }, () => ({
    x: Math.random() * canvas.width, y: -10 - Math.random() * 100,
    w: 6 + Math.random() * 10, h: 4 + Math.random() * 6,
    vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 4,
    rot: Math.random() * 360, rv: (Math.random() - 0.5) * 8,
    color: colores[Math.floor(Math.random() * colores.length)],
  }));

  function step() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    prt.forEach(p => {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color; ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h); ctx.restore();
      p.x += p.vx; p.y += p.vy; p.rot += p.rv; p.vy += 0.05;
      if (p.y > canvas.height + 20) { p.y = -10; p.x = Math.random() * canvas.width; p.vy = 2 + Math.random() * 4; }
    });
    confettiAnim = requestAnimationFrame(step);
  }
  step();
  setTimeout(pararConfeti, 8000);
}

function pararConfeti() {
  if (confettiAnim) { cancelAnimationFrame(confettiAnim); confettiAnim = null; }
  const c = document.getElementById('confettiCanvas');
  if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height);
}

/* ---- SONIDO ---- */
function reproducirSonidoEstadio() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.05);
      gain.gain.linearRampToValueAtTime(0, t + 0.4);
      osc.start(t); osc.stop(t + 0.5);
    });
  } catch (e) { /* silencioso */ }
}

/* ==============================
   COUNTDOWN
============================== */
function iniciarCountdown() {
  const mundialDate = new Date('2026-06-11T15:00:00-05:00');
  function update() {
    const diff = mundialDate - new Date();
    const el   = document.getElementById('countdown');
    if (diff <= 0) { el.textContent = '¡EL MUNDIAL YA COMENZÓ!'; return; }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.textContent = `${d}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
  }
  update(); setInterval(update, 1000);
}

/* ==============================
   ADMIN
============================== */
function openAdminOverlay()  { document.getElementById('adminOverlay').classList.remove('hidden'); document.getElementById('adminUser').focus(); }
function closeAdminOverlay() {
  document.getElementById('adminOverlay').classList.add('hidden');
  document.getElementById('adminError').classList.add('hidden');
  document.getElementById('adminUser').value = '';
  document.getElementById('adminPass').value = '';
}

function loginAdmin() {
  if (document.getElementById('adminUser').value === 'admin' &&
      document.getElementById('adminPass').value === '1234') {
    document.body.classList.add('admin-mode');
    sessionStorage.setItem('mundial_admin', '1'); // solo dura la sesión
    closeAdminOverlay();
    document.getElementById('btnAdmin').style.display = 'none';
    addLog('Sesión admin iniciada');
    showSection('admin');
  } else {
    document.getElementById('adminError').classList.remove('hidden');
  }
}

function verificarAdminGuardado() {
  if (sessionStorage.getItem('mundial_admin') === '1') {
    document.body.classList.add('admin-mode');
    document.getElementById('btnAdmin').style.display = 'none';
  }
}

function cerrarSesionAdmin() {
  document.body.classList.remove('admin-mode');
  sessionStorage.removeItem('mundial_admin');
  document.getElementById('btnAdmin').style.display = '';
  addLog('Sesión admin cerrada');
  showSection('dashboard');
}

async function reiniciarTorneo() {
  if (!confirm('¿Eliminar TODOS los participantes y el campeón? Esto es irreversible.')) return;
  if (!confirm('Confirmar: ¿Reiniciar todo?')) return;

  mostrarLoader(true);
  try {
    // Eliminar todos los participantes (filtro que siempre es true)
    await sb.delete('mundial_participantes', 'id=neq.00000000-0000-0000-0000-000000000000');
    await sb.patch('mundial_config', 'clave=eq.campeon', { valor: '' });
    localStorage.removeItem('mundial_campeon_cache');
    addLog('Torneo reiniciado');
    await cargarTodo();
    mostrarAlert('✅ Torneo reiniciado correctamente', 'ok');
  } catch (e) {
    mostrarAlert('❌ Error al reiniciar: ' + e.message, 'danger');
  } finally {
    mostrarLoader(false);
  }
}

/* ---- LOG (solo localStorage) ---- */
function addLog(texto) {
  const logs = JSON.parse(localStorage.getItem('mundial_log') || '[]');
  logs.unshift({ time: new Date().toLocaleTimeString('es-CL'), texto });
  if (logs.length > 50) logs.pop();
  localStorage.setItem('mundial_log', JSON.stringify(logs));
  renderLog();
}

function renderLog() {
  const el = document.getElementById('logActividad');
  if (!el) return;
  const logs = JSON.parse(localStorage.getItem('mundial_log') || '[]');
  el.innerHTML = logs.length === 0
    ? '<span style="color:var(--text-dim)">Sin actividad.</span>'
    : logs.map(l => `<div class="log-entry"><span class="log-time">${l.time}</span>${l.texto}</div>`).join('');
}

/* ==============================
   TEMA
============================== */
function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('mundial_theme', next);
  document.getElementById('themeBtn').textContent = next === 'dark' ? '🌙 Oscuro' : '☀️ Claro';
  const m = document.getElementById('themeBtnMobile');
  if (m) m.textContent = next === 'dark' ? '🌙' : '☀️';
  renderEstadisticas();
}

function aplicarTemaGuardado() {
  const t = localStorage.getItem('mundial_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
  const btn = document.getElementById('themeBtn');
  if (btn) btn.textContent = t === 'dark' ? '🌙 Oscuro' : '☀️ Claro';
}

/* ==============================
   EXPORTACIONES
============================== */
function exportarExcel() {
  if (typeof XLSX === 'undefined') { alert('XLSX no disponible. Verifica conexión.'); return; }
  const c2 = contarPorOpcion(2); const c3 = contarPorOpcion(3);
  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.json_to_sheet(participantes.map((p, i) => ({
    '#': i+1, 'Nombre': p.nombre, 'Selección 1': p.sel1||'',
    'Selección 2': p.sel2||'', 'Selección 3': p.sel3||'', 'Fecha': p.fecha||''
  })));
  XLSX.utils.book_append_sheet(wb, ws1, 'Participantes');

  const cT = contarTotal();
  const c1 = contarPorOpcion(1);
  const ws2 = XLSX.utils.json_to_sheet(
    Object.entries(cT).sort((a,b)=>b[1]-a[1]).map(([n, t]) => ({
      'Selección': n, '1ª Opción': c1[n]||0, '2ª Opción': c2[n]||0, '3ª Opción': c3[n]||0, 'Total': t
    }))
  );
  XLSX.utils.book_append_sheet(wb, ws2, 'Estadísticas');
  XLSX.writeFile(wb, 'mundial_2026_apuesta.xlsx');
  addLog('Excel exportado');
}

function exportarCSV() {
  const csv = ['#,Nombre,Selección 1,Selección 2,Selección 3,Fecha',
    ...participantes.map((p, i) =>
      [i+1, p.nombre, p.sel1, p.sel2||'', p.sel3||'', p.fecha||'']
      .map(v => `"${String(v).replace(/"/g,'""')}"`)
      .join(',')
    )
  ].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  descargar(blob, 'mundial_2026.csv');
  addLog('CSV exportado');
}

function imprimirListado() { window.print(); addLog('Listado impreso'); }

function exportarPDF() {
  const rows = participantes.map((p, i) =>
    `<tr><td>${i+1}</td><td>${p.nombre}</td><td>${p.sel1||''}</td><td>${p.sel2||''}</td><td>${p.sel3||''}</td><td>${p.fecha||''}</td></tr>`
  ).join('');
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
    <title>Mundial 2026</title>
    <style>body{font-family:Arial;font-size:12px;padding:20px}h1{color:#c9a227}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th{background:#1a3a28;color:#fff;padding:8px;text-align:left}
    td{padding:6px 8px;border-bottom:1px solid #ddd}
    tr:nth-child(even){background:#f9f9f9}</style>
  </head><body>
    <h1>⚽ Mundial 2026 — Apuesta Amistosa</h1>
    <p>Total: <strong>${participantes.length}</strong> participantes</p>
    <table><thead><tr><th>#</th><th>Nombre</th><th>Sel.1</th><th>Sel.2</th><th>Sel.3</th><th>Fecha</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <p style="color:#888;font-size:10px;margin-top:16px">Generado el ${new Date().toLocaleDateString('es-CL')}</p>
  </body></html>`);
  win.document.close();
  win.onload = () => win.print();
  addLog('PDF generado');
}

function descargar(blob, nombre) {
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: nombre });
  a.click(); URL.revokeObjectURL(a.href);
}

/* ---- ENTER en login ---- */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('adminPass')?.addEventListener('keydown', e => { if (e.key==='Enter') loginAdmin(); });
  document.getElementById('adminUser')?.addEventListener('keydown', e => { if (e.key==='Enter') document.getElementById('adminPass').focus(); });
});
