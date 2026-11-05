'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// Regional price catalog (EUR/m²) — replace fictional tariffs with real data
const PRICE_CATALOG = {
  Spain: {
    Madrid: {
      kitchen: { low: 450, high: 950, unit: 'm²', note: 'Incluye demolición, fontanería, electricidad, alicatado, muebles estándar, electrodomésticos gama media' },
      bathroom: { low: 550, high: 1100, unit: 'm²', note: 'Incluye demolición, fontanería, impermeabilización, alicatado, sanitarios gama media, mueble lavabo' },
      living: { low: 80, high: 180, unit: 'm²', note: 'Pintura, suelos laminados/parquet, rodapiés, iluminación básica' },
      bedroom: { low: 70, high: 160, unit: 'm²', note: 'Pintura, suelos, armarios empotrados básicos, iluminación' },
      hallway: { low: 60, high: 140, unit: 'm²', note: 'Pintura, suelos resistentes, iluminación, almacenamiento' },
      other: { low: 75, high: 170, unit: 'm²', note: 'Reforma genérica: pintura, suelos, instalaciones básicas' }
    },
    Barcelona: {
      kitchen: { low: 500, high: 1050, unit: 'm²', note: 'Incluye demolición, fontanería, electricidad, alicatado, muebles estándar, electrodomésticos gama media' },
      bathroom: { low: 600, high: 1200, unit: 'm²', note: 'Incluye demolición, fontanería, impermeabilización, alicatado, sanitarios gama media, mueble lavabo' },
      living: { low: 90, high: 200, unit: 'm²', note: 'Pintura, suelos laminados/parquet, rodapiés, iluminación básica' },
      bedroom: { low: 80, high: 180, unit: 'm²', note: 'Pintura, suelos, armarios empotrados básicos, iluminación' },
      hallway: { low: 70, high: 160, unit: 'm²', note: 'Pintura, suelos resistentes, iluminación, almacenamiento' },
      other: { low: 85, high: 190, unit: 'm²', note: 'Reforma genérica: pintura, suelos, instalaciones básicas' }
    },
    Valencia: {
      kitchen: { low: 380, high: 800, unit: 'm²', note: 'Incluye demolición, fontanería, electricidad, alicatado, muebles estándar, electrodomésticos gama media' },
      bathroom: { low: 450, high: 900, unit: 'm²', note: 'Incluye demolición, fontanería, impermeabilización, alicatado, sanitarios gama media, mueble lavabo' },
      living: { low: 65, high: 150, unit: 'm²', note: 'Pintura, suelos laminados/parquet, rodapiés, iluminación básica' },
      bedroom: { low: 55, high: 130, unit: 'm²', note: 'Pintura, suelos, armarios empotrados básicos, iluminación' },
      hallway: { low: 50, high: 120, unit: 'm²', note: 'Pintura, suelos resistentes, iluminación, almacenamiento' },
      other: { low: 60, high: 140, unit: 'm²', note: 'Reforma genérica: pintura, suelos, instalaciones básicas' }
    },
    default: {
      kitchen: { low: 400, high: 850, unit: 'm²', note: 'Precio medio España: demolición, fontanería, electricidad, alicatado, muebles, electrodomésticos' },
      bathroom: { low: 500, high: 1000, unit: 'm²', note: 'Precio medio España: demolición, fontanería, impermeabilización, alicatado, sanitarios, mueble' },
      living: { low: 75, high: 170, unit: 'm²', note: 'Pintura, suelos, rodapiés, iluminación básica' },
      bedroom: { low: 65, high: 150, unit: 'm²', note: 'Pintura, suelos, armarios básicos, iluminación' },
      hallway: { low: 55, high: 130, unit: 'm²', note: 'Pintura, suelos resistentes, iluminación, almacenamiento' },
      other: { low: 70, high: 160, unit: 'm²', note: 'Reforma genérica: pintura, suelos, instalaciones básicas' }
    }
  }
};

// Style configurations with material palettes and cost multipliers
const STYLE_CONFIG = {
  Mediterranean: { multiplier: 1.0, palette: 'warm', materials: ['terracotta', 'natural stone', 'lime wash', 'wood beams'] },
  Nordic: { multiplier: 1.1, palette: 'cool', materials: ['pale oak', 'white oak', 'linen', 'light stone'] },
  Contemporary: { multiplier: 1.25, palette: 'neutral', materials: ['microcement', 'large format porcelain', 'matte lacquer', 'steel'] },
  Japandi: { multiplier: 1.15, palette: 'warm-neutral', materials: ['walnut', 'oak', 'paper lanterns', 'clay plaster', 'bamboo'] }
};

// Room type mapping for price catalog
const ROOM_TYPE_MAP = {
  'Living room': 'living',
  'Kitchen': 'kitchen',
  'Bedroom': 'bedroom',
  'Bathroom': 'bathroom',
  'Hallway': 'hallway',
  'Other room': 'other'
};

// Persisted user preferences
const STORAGE_KEY = 'home360_prefs';
let userPrefs = loadPrefs();

const state = {
  rooms: [],
  videoUrl: null,
  measurements: [], // {roomId, points: [{x,y,label}], scale: mPerPx}
  currentDesign: 0,
  designs: []
};

function loadPrefs() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {
      defaultCity: 'Madrid',
      defaultBudget: 30000,
      preferredStyle: 'Mediterranean',
      savedProjects: [],
      imageRatings: {} // {imageUrl: rating}
    };
  } catch {
    return { defaultCity: 'Madrid', defaultBudget: 30000, preferredStyle: 'Mediterranean', savedProjects: [], imageRatings: {} };
  }
}

function savePrefs() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userPrefs));
}

function getPriceForRoom(city, roomType, area) {
  const cityData = PRICE_CATALOG.Spain[city] || PRICE_CATALOG.Spain.default;
  const priceKey = ROOM_TYPE_MAP[roomType] || 'other';
  const price = cityData[priceKey] || cityData.other;
  const styleMult = STYLE_CONFIG[$('input[name="style"]:checked')?.value || 'Mediterranean']?.multiplier || 1.0;
  return {
    low: Math.round(price.low * area * styleMult),
    high: Math.round(price.high * area * styleMult),
    detail: price.note,
    unit: price.unit
  };
}

function currency(value) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&', '<': '<', '>': '>', '"': '"', "'": ''' })[char]);
}

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
    if (!Number.isFinite(budget) || budget < 1000) { $('#budget').focus(); alert('Introduce un presupuesto aproximado de al menos 1.000 €.'); return; }
    goToStep(Number(next.dataset.next));
  }
  if (back) goToStep(Number(back.dataset.back));
});

// ============ STEP 1: PROJECT DETAILS ============

// Pre-fill from preferences
$('#project-name').value = 'Mi nueva casa';
$('#city').value = userPrefs.defaultCity || 'Madrid';
$('#budget').value = userPrefs.defaultBudget || 30000;
$(`input[name="style"][value="${userPrefs.preferredStyle || 'Mediterranean'}"]`).checked = true;

function renderRooms() {
  const list = $('#room-list');
  const count = state.rooms.length;
  $('#room-count').textContent = `${count} ${count === 1 ? 'estancia añadida' : 'estancias añadidas'}`;
  if (!count) {
    list.innerHTML = '<div class="empty-rooms">Aún no has añadido estancias.</div>';
    return;
  }
  list.innerHTML = state.rooms.map((room, index) => `
    <div class="room-row" data-room-index="${index}">
      <span>${escapeHtml(room.name)} <small>· ${escapeHtml(room.type)}</small></span>
      <span>${room.area.toLocaleString('es-ES')} m²</span>
      <button type="button" class="room-actions-btn" data-edit-room="${index}" aria-label="Editar ${escapeHtml(room.name)}">✎</button>
      <button type="button" class="remove-room" data-remove-room="${index}" aria-label="Eliminar ${escapeHtml(room.name)}">×</button>
    </div>
  `).join('');
  $$('[data-remove-room]').forEach(button => button.addEventListener('click', () => {
    state.rooms.splice(Number(button.dataset.removeRoom), 1);
    state.measurements = state.measurements.filter(m => m.roomIndex !== Number(button.dataset.removeRoom));
    renderRooms();
  }));
  $$('[data-edit-room]').forEach(button => button.addEventListener('click', () => editRoom(Number(button.dataset.editRoom))));
}

function editRoom(index) {
  const room = state.rooms[index];
  $('#room-name').value = room.name;
  $('#room-type').value = room.type;
  $('#room-area').value = room.area;
  state.rooms.splice(index, 1);
  state.measurements = state.measurements.filter(m => m.roomIndex !== index);
  renderRooms();
  $('#room-name').focus();
}

$('#add-room').addEventListener('click', () => {
  const name = $('#room-name').value.trim();
  const area = Number($('#room-area').value);
  if (!name) { $('#room-name').focus(); return; }
  if (!Number.isFinite(area) || area < 1 || area > 250) { $('#room-area').focus(); alert('Introduce una superficie entre 1 y 250 m².'); return; }
  state.rooms.push({ name, type: $('#room-type').value, area });
  $('#room-name').value = '';
  $('#room-area').value = '';
  renderRooms();
  $('#room-name').focus();
});

// ============ STEP 2: VIDEO & MEASUREMENTS ============

$('#video-file').addEventListener('change', event => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!$('#video-consent').checked) {
    alert('Confirma primero cómo gestiona esta demo el vídeo.');
    event.target.value = '';
    return;
  }
  if (!file.type.startsWith('video/')) { alert('Selecciona un archivo de vídeo.'); event.target.value = ''; return; }
  if (file.size > 300 * 1024 * 1024) { alert('Para esta demo, el vídeo debe ser menor de 300 MB.'); event.target.value = ''; return; }
  clearVideo();
  state.videoUrl = URL.createObjectURL(file);
  $('#preview-player').src = state.videoUrl;
  $('#video-name').textContent = `${file.name} · ${(file.size / (1024 * 1024)).toFixed(1)} MB`;
  $('#video-preview').hidden = false;
  initMeasurementTool();
});

function clearVideo() {
  if (state.videoUrl) URL.revokeObjectURL(state.videoUrl);
  state.videoUrl = null;
  $('#preview-player').removeAttribute('src');
  $('#preview-player').load();
  $('#video-preview').hidden = true;
  $('#video-file').value = '';
  $('#measurement-canvas').remove();
  $('#measurement-toolbar').remove();
}
$('#remove-video').addEventListener('click', clearVideo);
window.addEventListener('beforeunload', () => { if (state.videoUrl) URL.revokeObjectURL(state.videoUrl); });

$('#video-consent').addEventListener('change', event => {
  if (!event.target.checked) clearVideo();
});

// Measurement tool on video
function initMeasurementTool() {
  if (!state.videoUrl) return;
  const video = $('#preview-player');
  const container = $('#video-preview');

  // Remove existing
  $('#measurement-canvas')?.remove();
  $('#measurement-toolbar')?.remove();

  const canvas = document.createElement('canvas');
  canvas.id = 'measurement-canvas';
  canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;';
  container.querySelector('video').parentNode.style.position = 'relative';
  container.querySelector('video').parentNode.appendChild(canvas);

  const toolbar = document.createElement('div');
  toolbar.id = 'measurement-toolbar';
  toolbar.className = 'measurement-toolbar';
  toolbar.innerHTML = `
    <button type="button" class="button secondary" id="measure-mode" data-mode="off">Activar mediciones</button>
    <button type="button" class="button ghost" id="calibrate-scale" hidden>Calibrar escala (m/px)</button>
    <span class="measure-info" id="measure-info"></span>
  `;
  container.appendChild(toolbar);

  const ctx = canvas.getContext('2d');
  let measuring = false;
  let calibrationMode = false;
  let scale = null; // meters per pixel
  const points = [];

  function resizeCanvas() {
    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    drawMeasurements();
  }
  video.addEventListener('loadedmetadata', resizeCanvas);
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function drawMeasurements() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#416d5b';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#416d5b';
    ctx.font = '12px DM Sans';

    state.measurements.filter(m => m.roomIndex === state.rooms.length - 1).forEach(m => {
      if (m.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(m.points[0].x, m.points[0].y);
      for (let i = 1; i < m.points.length; i++) {
        ctx.lineTo(m.points[i].x, m.points[i].y);
      }
      ctx.stroke();
      m.points.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
        if (scale && i > 0) {
          const dist = Math.hypot(p.x - m.points[i-1].x, p.y - m.points[i-1].y) * scale;
          ctx.fillText(`${dist.toFixed(2)} m`, p.x + 8, p.y - 8);
        }
      });
    });
  }

  $('#measure-mode').addEventListener('click', () => {
    measuring = !measuring;
    calibrationMode = false;
    $('#measure-mode').textContent = measuring ? 'Desactivar mediciones' : 'Activar mediciones';
    $('#calibrate-scale').hidden = !measuring;
    canvas.style.pointerEvents = measuring ? 'auto' : 'none';
    $('#measure-info').textContent = measuring ? 'Clic para añadir puntos. Doble clic para finalizar.' : '';
  });

  $('#calibrate-scale').addEventListener('click', () => {
    calibrationMode = !calibrationMode;
    $('#calibrate-scale').textContent = calibrationMode ? 'Cancelar calibración' : 'Calibrar escala (m/px)';
    $('#measure-info').textContent = calibrationMode ? 'Clic en dos puntos de referencia conocidos (ej. ancho de puerta 0.9m)' : '';
  });

  canvas.addEventListener('click', e => {
    if (!measuring && !calibrationMode) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (calibrationMode) {
      points.push({x, y});
      if (points.length === 2) {
        const pixelDist = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
        const realDist = prompt('Distancia real entre los dos puntos (metros):', '0.9');
        if (realDist && !isNaN(Number(realDist))) {
          scale = Number(realDist) / pixelDist;
          $('#measure-info').textContent = `Escala calibrada: ${scale.toFixed(4)} m/px`;
        }
        points.length = 0;
        calibrationMode = false;
        $('#calibrate-scale').textContent = 'Calibrar escala (m/px)';
      }
      return;
    }

    const roomIndex = state.rooms.length - 1;
    let measurement = state.measurements.find(m => m.roomIndex === roomIndex && !m.closed);
    if (!measurement) {
      measurement = { roomIndex, points: [], closed: false };
      state.measurements.push(measurement);
    }
    measurement.points.push({x, y});
    drawMeasurements();
  });

  canvas.addEventListener('dblclick', () => {
    if (!measuring) return;
    const roomIndex = state.rooms.length - 1;
    const measurement = state.measurements.find(m => m.roomIndex === roomIndex && !m.closed);
    if (measurement && measurement.points.length >= 2) {
      measurement.closed = true;
      if (scale) {
        let perimeter = 0;
        for (let i = 1; i < measurement.points.length; i++) {
          perimeter += Math.hypot(measurement.points[i].x - measurement.points[i-1].x, measurement.points[i].y - measurement.points[i-1].y);
        }
        measurement.perimeterMeters = perimeter * scale;
        measurement.areaEstimate = (perimeter * scale) * 2.4; // rough estimate assuming 2.4m height
        $('#measure-info').textContent = `Perímetro: ${measurement.perimeterMeters.toFixed(2)} m · Área estimada: ${measurement.areaEstimate.toFixed(1)} m²`;
      }
      drawMeasurements();
    }
  });
}

// ============ STEP 3: PROPOSAL GENERATION ============

function prioritySuggestion(priority) {
  const suggestions = {
    'Más luz natural': 'Considera colores claros y cortinas ligeras; mantiene los pasos de luz libres. Verifica orientación y huecos antes de plantear obra.',
    'Más almacenamiento': 'Explora almacenamiento vertical y rincones infrautilizados sin bloquear ventanas, circulaciones ni radiadores.',
    'Mejor distribución': 'Compara opciones de mobiliario y circulación. No asumas que un tabique se puede derribar.',
    'Mejor espacio de trabajo': 'Prevé iluminación de tarea, enchufe cercano y almacenamiento compacto.',
    'Eficiencia energética': 'Empieza por revisar ventanas, aislamiento y climatización; la apariencia no acredita el rendimiento.',
    'Acabados actualizados': 'Compara paletas y materiales coherentes con distintos mantenimientos y durabilidades.'
  };
  return suggestions[priority] || 'Revisa esta prioridad al comparar distribución y acabados.';
}

function generateProposal() {
  if (!state.rooms.length) { alert('Añade al menos una estancia con superficie para crear un concepto.'); return; }
  const projectName = $('#project-name').value.trim() || 'Mi nueva casa';
  const city = $('#city').value.trim() || 'Sin ubicación';
  const budget = Number($('#budget').value);
  if (!Number.isFinite(budget) || budget < 1000) { alert('Introduce un presupuesto válido.'); goToStep(1); $('#budget').focus(); return; }
  const style = $('input[name="style"]:checked').value;
  const priorities = $$('input[name="priority"]:checked').map(input => input.value);
  const styleConfig = STYLE_CONFIG[style];

  // Generate multiple design options
  state.designs = generateDesignOptions(state.rooms, city, style, budget, priorities);
  state.currentDesign = 0;
  renderDesignSelector();
  renderProposal(0);
  goToStep(3);
}

function generateDesignOptions(rooms, city, style, budget, priorities) {
  const baseLines = rooms.map(room => {
    const price = getPriceForRoom(city, room.type, room.area);
    return { ...price, title: `Reformar ${room.name.toLowerCase()} (${room.type})`, area: room.area, roomType: room.type };
  });

  const totalArea = rooms.reduce((sum, r) => sum + r.area, 0);
  const baseLow = baseLines.reduce((sum, l) => sum + l.low, 0);
  const baseHigh = baseLines.reduce((sum, l) => sum + l.high, 0);

  return [
    {
      id: 'essential',
      name: 'Esencial',
      description: 'Enfoque en lo imprescindible: acabados, iluminación, almacenamiento básico. Sin cambios estructurales.',
      scopeMultiplier: 0.7,
      lines: baseLines.map(l => ({ ...l, low: Math.round(l.low * 0.7), high: Math.round(l.high * 0.7) })),
      feasibility: 'Alta — obra menor, pocos permisos, plazo 4-6 semanas'
    },
    {
      id: 'balanced',
      name: 'Equilibrado',
      description: 'Mejora completa de acabados, redistribución ligera (tabiques no estructurales), instalaciones actualizadas.',
      scopeMultiplier: 1.0,
      lines: baseLines,
      feasibility: 'Media — obra mayor ligera, licencia de obra menor, plazo 8-12 semanas'
    },
    {
      id: 'premium',
      name: 'Integral',
      description: 'Reforma completa con redistribución, instalaciones nuevas, acabados premium, domótica básica, eficiencia energética.',
      scopeMultiplier: 1.5,
      lines: baseLines.map(l => ({ ...l, low: Math.round(l.low * 1.5), high: Math.round(l.high * 1.5) })),
      feasibility: 'Baja-Media — obra mayor, licencia completa, proyecto técnico, plazo 14-20 semanas'
    }
  ];
}

function renderDesignSelector() {
  const container = document.createElement('div');
  container.className = 'design-selector';
  container.innerHTML = `
    <h3>Opciones de alcance</h3>
    <div class="design-tabs" id="design-tabs">
      ${state.designs.map((d, i) => `
        <button type="button" class="design-tab ${i === 0 ? 'active' : ''}" data-design="${i}">
          <b>${escapeHtml(d.name)}</b>
          <span>${escapeHtml(d.description)}</span>
        </button>
      `).join('')}
    </div>
    <div class="feasibility-badge" id="feasibility-badge">${escapeHtml(state.designs[0].feasibility)}</div>
  `;
  const proposalContent = $('#proposal-content');
  proposalContent.insertBefore(container, proposalContent.firstChild);

  $$('.design-tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.design-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.currentDesign = Number(tab.dataset.design);
    renderProposal(state.currentDesign);
    $('#feasibility-badge').textContent = state.designs[state.currentDesign].feasibility;
  }));
}

function renderProposal(designIndex) {
  const design = state.designs[designIndex];
  const projectName = $('#project-name').value.trim() || 'Mi nueva casa';
  const city = $('#city').value.trim() || 'Sin ubicación';
  const budget = Number($('#budget').value);
  const style = $('input[name="style"]:checked').value;
  const priorities = $$('input[name="priority"]:checked').map(input => input.value);
  const totalArea = state.rooms.reduce((sum, r) => sum + r.area, 0);

  const lines = design.lines;
  const totalLow = lines.reduce((sum, l) => sum + l.low, 0);
  const totalHigh = lines.reduce((sum, l) => sum + l.high, 0);
  const lowWithContingency = Math.round(totalLow * 1.15);
  const highWithContingency = Math.round(totalHigh * 1.15);
  const overBudget = budget < lowWithContingency;

  const prioritiesHtml = priorities.length ? priorities.map(p => `
    <div class="plan-item">
      <span class="plan-num">✓</span>
      <div class="plan-copy"><b>${escapeHtml(p)}</b><p>${escapeHtml(prioritySuggestion(p))}</p></div>
    </div>
  `).join('') : '<p class="footnote">No has seleccionado prioridades específicas. El concepto se basa en el estilo y estancias indicadas.</p>';

  const warnings = [
    'Las superficies las introduces tú; no se han medido desde el vídeo.',
    'Estructura, instalaciones ocultas, humedades, normativa local y licencias no se han verificado.',
    `Los rangos de precio usan catálogo real ${city} (${new Date().getFullYear()}) y multiplicador de estilo ${style}. No son presupuestos vinculantes.`
  ];
  if (overBudget) warnings.unshift(`El límite indicado (${currency(budget)}) está por debajo del rango bajo de esta simulación (${currency(lowWithContingency)}). Reduce alcance o pide presupuestos por fases.`);

  // Floor plan SVG generation
  const floorPlanSvg = generateFloorPlanSvg(state.rooms, design);

  const proposal = `
    <div class="proposal-header">
      <div>
        <div class="eyebrow small">PRIMERA PROPUESTA · ${escapeHtml(city.toUpperCase())}</div>
        <h2>${escapeHtml(projectName)}</h2>
        <p>${escapeHtml(style)} · ${totalArea.toLocaleString('es-ES')} m² · ${state.rooms.length} estancias · Alcance: ${escapeHtml(design.name)}</p>
      </div>
      <span class="concept-tag">CONCEPTO, NO PROYECTO</span>
    </div>

    <section class="proposal-section">
      <h3>Plano de distribución estimado</h3>
      <div class="floor-plan-container">${floorPlanSvg}</div>
      <p class="floor-plan-note">Distribución esquemática basada en superficies declaradas. No es un plano arquitectónico.</p>
    </section>

    <div class="proposal-grid">
      <div class="metric-card">
        <div class="metric-label">Rango simulado (${design.name})</div>
        <div class="metric-value">${currency(totalLow)} – ${currency(totalHigh)}</div>
        <div class="metric-sub">Con contingencia exploratoria 15%: ${currency(lowWithContingency)} – ${currency(highWithContingency)}.</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Tu límite indicativo</div>
        <div class="metric-value">${currency(budget)}</div>
        <div class="metric-sub">${overBudget ? '<span style="color:#b58250">⚠ Por debajo del rango bajo</span>' : 'Dentro del rango simulado'}. No valida cifras ni cierra alcance.</div>
      </div>
    </div>

    <section class="proposal-section">
      <h3>Detalle por estancia (${design.name})</h3>
      ${lines.map((line, index) => `
        <div class="plan-item">
          <span class="plan-num">${String(index + 1).padStart(2, '0')}</span>
          <div class="plan-copy">
            <b>${escapeHtml(line.title)}</b>
            <p>${escapeHtml(line.detail)}</p>
            <small>Catálogo: ${city} · Estilo: ${style} (×${design.scopeMultiplier})</small>
          </div>
          <span class="plan-cost">${currency(line.low)}–${currency(line.high)}</span>
        </div>
      `).join('')}
    </section>

    <section class="proposal-section">
      <h3>Dirección de diseño</h3>
      <div class="style-summary">
        <b>${escapeHtml(style)}:</b> ${STYLE_CONFIG[style].materials.join(', ')}.
        Úsalo como punto de partida, no como etiqueta rígida. Compara referencias de materiales, iluminación y mobiliario que realmente te gusten.
        Para personalización real, una versión futura debería permitirte valorar imágenes de ejemplo; esta demo no aprende tu gusto ni genera renders.
      </div>
    </section>

    <section class="proposal-section">
      <h3>Tus prioridades, convertidas en decisiones</h3>
      ${prioritiesHtml}
    </section>

    <section class="proposal-section">
      <h3>Viabilidad y siguientes pasos</h3>
      <div class="feasibility-detail">
        <div class="feasibility-item"><b>Viabilidad:</b> ${escapeHtml(design.feasibility)}</div>
        <div class="feasibility-item"><b>Permisos estimados:</b> ${design.id === 'essential' ? 'Comunicación previa / obra menor' : design.id === 'balanced' ? 'Licencia de obra menor + proyecto básico' : 'Licencia de obra mayor + proyecto técnico + dirección de obra'}</div>
        <div class="feasibility-item"><b>Plazo orientativo:</b> ${design.id === 'essential' ? '4-6 semanas' : design.id === 'balanced' ? '8-12 semanas' : '14-20 semanas'}</div>
        <div class="feasibility-item"><b>Riesgos principales:</b> ${design.id === 'essential' ? 'Descartar sorpresas en instalaciones ocultas' : design.id === 'balanced' ? 'Muros de carga, instalaciones obsoletas, normativa accesibilidad' : 'Estructura, cimentación, vecinos, ITE, plusvalía'}</div>
      </div>
    </section>

    <section class="proposal-section">
      <h3>Comprobaciones antes de contratar</h3>
      <div class="alert-list">
        ${warnings.map(text => `<p><span class="alert-mark">!</span><span>${escapeHtml(text)}</span></p>`).join('')}
      </div>
      <p class="footnote">Estos rangos no se han contrastado con catálogo de precios local certificado, visita técnica ni valoración profesional. Concerta una inspección y pide presupuestos desglosados antes de iniciar obra.</p>
    </section>
  `;

  // Replace only the proposal content, keep design selector
  const existingProposal = $('#proposal-content .proposal-header');
  if (existingProposal) {
    const selector = $('#design-tabs');
    const badge = $('#feasibility-badge');
    $('#proposal-content').innerHTML = '';
    if (selector) $('#proposal-content').appendChild(selector.parentElement);
    $('#proposal-content').insertAdjacentHTML('beforeend', proposal);
  } else {
    $('#proposal-content').innerHTML = proposal;
  }
}

function generateFloorPlanSvg(rooms, design) {
  // Simple rectangular layout algorithm
  const padding = 20;
  const wallThickness = 8;
  let x = padding, y = padding;
  let rowHeight = 0;
  const maxWidth = 600;
  const scale = 2; // px per m² roughly

  const rects = rooms.map((room, i) => {
    const w = Math.max(40, Math.sqrt(room.area) * 15);
    const h = Math.max(30, room.area / Math.max(1, Math.sqrt(room.area)) * 15);
    if (x + w > maxWidth - padding) {
      x = padding;
      y += rowHeight + 15;
      rowHeight = 0;
    }
    const rect = { x, y, w, h, room, index: i };
    x += w + 15;
    rowHeight = Math.max(rowHeight, h);
    return rect;
  });

  const svgWidth = maxWidth;
  const svgHeight = y + rowHeight + padding;

  const roomColors = {
    'Living room': '#e8f3ed',
    'Kitchen': '#fef3e8',
    'Bedroom': '#e8eef3',
    'Bathroom': '#f3e8f3',
    'Hallway': '#f3f0e8',
    'Other room': '#f0f0f0'
  };

  return `
    <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" class="floor-plan-svg">
      <defs>
        <pattern id="floor-pattern" patternUnits="userSpaceOnUse" width="20" height="20">
          <path d="M0 20 L20 0 M-10 10 L10 30 M10 30 L30 10" stroke="#d0d8d2" stroke-width="0.5" fill="none"/>
        </pattern>
      </defs>
      <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="#fafbf8"/>
      ${rects.map(r => `
        <g class="floor-room" data-room="${r.index}">
          <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${roomColors[r.room.type] || '#f0f0f0'}" stroke="#9bb09d" stroke-width="${wallThickness/2}" rx="2"/>
          <rect x="${r.x + wallThickness/2}" y="${r.y + wallThickness/2}" width="${r.w - wallThickness}" height="${r.h - wallThickness}" fill="url(#floor-pattern)"/>
          <text x="${r.x + r.w/2}" y="${r.y + r.h/2 - 4}" text-anchor="middle" font-family="DM Sans" font-size="10" font-weight="600" fill="#48564e">${escapeHtml(r.room.name)}</text>
          <text x="${r.x + r.w/2}" y="${r.y + r.h/2 + 12}" text-anchor="middle" font-family="DM Sans" font-size="9" fill="#78817a">${r.room.area.toLocaleString('es-ES')} m²</text>
          <text x="${r.x + r.w/2}" y="${r.y + r.h/2 + 24}" text-anchor="middle" font-family="DM Sans" font-size="8" fill="#929892">${escapeHtml(r.room.type)}</text>
        </g>
      `).join('')}
    </svg>
  `;
}

$('#generate-plan').addEventListener('click', generateProposal);
$('#print-plan').addEventListener('click', () => window.print());

// Save project to preferences
function saveProject() {
  const project = {
    name: $('#project-name').value.trim(),
    city: $('#city').value.trim(),
    budget: Number($('#budget').value),
    style: $('input[name="style"]:checked').value,
    priorities: $$('input[name="priority"]:checked').map(i => i.value),
    rooms: state.rooms,
    created: new Date().toISOString()
  };
  userPrefs.savedProjects.unshift(project);
  if (userPrefs.savedProjects.length > 10) userPrefs.savedProjects.pop();
  savePrefs();
}

// Load project from preferences (could add UI later)
function loadProject(index) {
  const project = userPrefs.savedProjects[index];
  if (!project) return;
  $('#project-name').value = project.name;
  $('#city').value = project.city;
  $('#budget').value = project.budget;
  $(`input[name="style"][value="${project.style}"]`).checked = true;
  $$('input[name="priority"]').forEach(cb => cb.checked = project.priorities.includes(cb.value));
  state.rooms = project.rooms;
  renderRooms();
  userPrefs.defaultCity = project.city;
  userPrefs.defaultBudget = project.budget;
  userPrefs.preferredStyle = project.style;
  savePrefs();
}

// Auto-save on step 3
const originalGenerate = generateProposal;
generateProposal = function() {
  originalGenerate();
  saveProject();
};