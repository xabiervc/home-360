'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const state = { rooms: [], videoUrl: null };

function goToStep(step) {
  $$('.wizard-panel').forEach(panel => panel.classList.toggle('active', Number(panel.dataset.panel) === step));
  $$('.step[data-step-indicator]').forEach(indicator => {
    const n = Number(indicator.dataset.stepIndicator);
    indicator.classList.toggle('active', n === step);
    indicator.classList.toggle('done', n < step);
  });
  $('#wizard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.addEventListener('click', event => {
  const next = event.target.closest('[data-next]');
  const back = event.target.closest('[data-back]');
  if (next) {
    if (!$('#project-name').value.trim()) { $('#project-name').focus(); return; }
    const budget = Number($('#budget').value);
    if (!Number.isFinite(budget) || budget < 1000) { $('#budget').focus(); alert('Introduce un presupuesto orientativo de al menos 1.000 €.'); return; }
    goToStep(Number(next.dataset.next));
  }
  if (back) goToStep(Number(back.dataset.back));
});

function renderRooms() {
  const list = $('#room-list');
  $('#room-count').textContent = `${state.rooms.length} ${state.rooms.length === 1 ? 'añadida' : 'añadidas'}`;
  if (!state.rooms.length) {
    list.innerHTML = '<div class="empty-rooms">Aún no has añadido habitaciones.</div>';
    return;
  }
  list.innerHTML = state.rooms.map((room, index) => `<div class="room-row"><span>${escapeHtml(room.name)} <small>· ${escapeHtml(room.type)}</small></span><span>${room.area.toLocaleString('es-ES')} m²</span><button type="button" class="remove-room" data-remove-room="${index}" aria-label="Eliminar ${escapeHtml(room.name)}">×</button></div>`).join('');
  $$('[data-remove-room]').forEach(button => button.addEventListener('click', () => {
    state.rooms.splice(Number(button.dataset.removeRoom), 1);
    renderRooms();
  }));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

$('#add-room').addEventListener('click', () => {
  const name = $('#room-name').value.trim();
  const area = Number($('#room-area').value);
  if (!name) { $('#room-name').focus(); return; }
  if (!Number.isFinite(area) || area < 1 || area > 250) { $('#room-area').focus(); alert('Indica una superficie entre 1 y 250 m².'); return; }
  state.rooms.push({ name, type: $('#room-type').value, area });
  $('#room-name').value = '';
  $('#room-area').value = '';
  renderRooms();
  $('#room-name').focus();
});

$('#video-file').addEventListener('change', event => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!$('#video-consent').checked) {
    alert('Confirma primero que entiendes cómo se trata el vídeo en esta demo.');
    event.target.value = '';
    return;
  }
  if (!file.type.startsWith('video/')) { alert('Selecciona un archivo de vídeo.'); event.target.value = ''; return; }
  if (file.size > 300 * 1024 * 1024) { alert('Para esta demo el vídeo debe ocupar menos de 300 MB.'); event.target.value = ''; return; }
  clearVideo();
  state.videoUrl = URL.createObjectURL(file);
  $('#preview-player').src = state.videoUrl;
  $('#video-name').textContent = `${file.name} · ${(file.size / (1024 * 1024)).toFixed(1)} MB`;
  $('#video-preview').hidden = false;
});

function clearVideo() {
  if (state.videoUrl) URL.revokeObjectURL(state.videoUrl);
  state.videoUrl = null;
  $('#preview-player').removeAttribute('src');
  $('#preview-player').load();
  $('#video-preview').hidden = true;
  $('#video-file').value = '';
}
$('#remove-video').addEventListener('click', clearVideo);
window.addEventListener('beforeunload', () => { if (state.videoUrl) URL.revokeObjectURL(state.videoUrl); });

function currency(value) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function lineForRoom(room) {
  if (room.type === 'Cocina') return { title: `Actualizar acabados de ${room.name.toLowerCase()}`, low: room.area * 280, high: room.area * 650, detail: 'Estimación ilustrativa por superficie. No incluye electrodomésticos, cambio de distribución ni renovación completa de instalaciones.' };
  if (room.type === 'Baño') return { title: `Actualizar acabados de ${room.name.toLowerCase()}`, low: room.area * 350, high: room.area * 800, detail: 'Estimación ilustrativa. Fontanería, impermeabilización y estado existente pueden alterar mucho el coste.' };
  return { title: `Pintura y acabados de ${room.name.toLowerCase()}`, low: room.area * 45, high: room.area * 130, detail: 'Mejora estética conservando la distribución. El rango depende del estado y de los materiales.' };
}

function prioritySuggestion(priority) {
  const suggestions = {
    'Más luz natural': 'Valorar colores claros, cortinas ligeras y mantener despejados los recorridos de luz; comprobar orientación y huecos antes de proponer obra.',
    'Más almacenaje': 'Buscar almacenamiento vertical y aprovechar rincones sin bloquear ventanas, pasos ni radiadores.',
    'Mejor distribución': 'Comparar alternativas de mobiliario y circulación. No asumir que un tabique puede demolerse.',
    'Más espacio para trabajar': 'Reservar una zona de trabajo con iluminación adecuada, toma eléctrica cercana y almacenamiento compacto.',
    'Mejorar eficiencia energética': 'Priorizar una inspección de ventanas, aislamiento y climatización; no inferir su rendimiento visualmente.',
    'Actualizar acabados': 'Probar una paleta coherente y comparar materiales de mantenimiento y durabilidad diferentes.'
  };
  return suggestions[priority] || 'Revisar esta prioridad al comparar las opciones de distribución y acabados.';
}

function generateProposal() {
  if (!state.rooms.length) { alert('Añade al menos una estancia con superficie para preparar la propuesta.'); return; }
  const projectName = $('#project-name').value.trim() || 'Mi nuevo hogar';
  const city = $('#city').value.trim() || 'Zona sin especificar';
  const budget = Number($('#budget').value);
  if (!Number.isFinite(budget) || budget < 1000) { alert('Introduce un presupuesto válido.'); goToStep(1); $('#budget').focus(); return; }
  const style = $('input[name="style"]:checked').value;
  const priorities = $$('input[name="priority"]:checked').map(input => input.value);
  const lines = state.rooms.map(lineForRoom);
  const totalLow = lines.reduce((sum, line) => sum + line.low, 0);
  const totalHigh = lines.reduce((sum, line) => sum + line.high, 0);
  const totalArea = state.rooms.reduce((sum, room) => sum + room.area, 0);
  const lowWithContingency = totalLow * 1.15;
  const highWithContingency = totalHigh * 1.15;
  const prioritiesHtml = priorities.length ? priorities.map(priority => `<div class="plan-item"><span class="plan-num">✓</span><div class="plan-copy"><b>${escapeHtml(priority)}</b><p>${escapeHtml(prioritySuggestion(priority))}</p></div></div>`).join('') : '<p class="footnote">Aún no has seleccionado prioridades concretas; la propuesta se basa en el estilo y las estancias.</p>';
  const overBudget = budget < lowWithContingency;
  const warnings = [
    'Las superficies son las que has introducido; no se han medido a partir del vídeo.',
    'No se ha comprobado estructura, instalaciones ocultas, humedades, normativa ni permisos.',
    'Los precios son rangos ficticios para probar la interfaz: no son precios locales ni presupuestos de profesionales.'
  ];
  if (overBudget) warnings.unshift('El límite indicado está por debajo del extremo bajo de esta simulación. Reduce el alcance o pide presupuestos por fases.');
  const proposal = `
    <div class="proposal-header"><div><div class="eyebrow small">PRIMERA LECTURA · ${escapeHtml(city.toUpperCase())}</div><h2>${escapeHtml(projectName)}</h2><p>${escapeHtml(style)} · ${totalArea.toLocaleString('es-ES')} m² indicados · ${state.rooms.length} estancias</p></div><span class="concept-tag">CONCEPTO, NO PROYECTO</span></div>
    <div class="proposal-grid"><div class="metric-card"><div class="metric-label">Rango simulado</div><div class="metric-value">${currency(totalLow)} – ${currency(totalHigh)}</div><div class="metric-sub">Con margen exploratorio del 15%: ${currency(lowWithContingency)} – ${currency(highWithContingency)}.</div></div><div class="metric-card"><div class="metric-label">Tu límite orientativo</div><div class="metric-value">${currency(budget)}</div><div class="metric-sub">${overBudget ? 'El alcance simulado supera el límite incluso en su mínimo.' : 'No significa que los precios estén validados ni que el alcance esté cerrado.'}</div></div></div>
    <section class="proposal-section"><h3>Posible plan por estancias</h3>${lines.map((line, index) => `<div class="plan-item"><span class="plan-num">${String(index + 1).padStart(2, '0')}</span><div class="plan-copy"><b>${escapeHtml(line.title)}</b><p>${escapeHtml(line.detail)}</p></div><span class="plan-cost">${currency(line.low)}–${currency(line.high)}</span></div>`).join('')}</section>
    <section class="proposal-section"><h3>Cómo orientar el diseño</h3><div class="style-summary"><b>${escapeHtml(style)}:</b> úsalo como punto de partida, no como una etiqueta rígida. Compara referencias de materiales, iluminación y mobiliario que sí te gusten. Para personalizar de verdad, la siguiente versión debería pedirte que valores imágenes de ejemplo; esta demo aún no aprende tus gustos ni genera renders.</div></section>
    <section class="proposal-section"><h3>Tus prioridades, traducidas a decisiones</h3>${prioritiesHtml}</section>
    <section class="proposal-section"><h3>Comprobaciones antes de contratar</h3><div class="alert-list">${warnings.map(text => `<p><span class="alert-mark">!</span><span>${escapeHtml(text)}</span></p>`).join('')}</div><p class="footnote">Las cantidades no se han contrastado con un catálogo regional, visita técnica ni profesional. Pide una inspección y presupuestos desglosados antes de ejecutar obras.</p></section>`;
  $('#proposal-content').innerHTML = proposal;
  goToStep(3);
}
$('#generate-plan').addEventListener('click', generateProposal);
$('#print-plan').addEventListener('click', () => window.print());

// Keep the video selection explicit; never trigger camera or upload automatically.
$('#video-consent').addEventListener('change', event => {
  if (!event.target.checked) clearVideo();
});
