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
    if (!Number.isFinite(budget) || budget < 1000) { $('#budget').focus(); alert('Enter an approximate budget of at least €1,000.'); return; }
    goToStep(Number(next.dataset.next));
  }
  if (back) goToStep(Number(back.dataset.back));
});

function renderRooms() {
  const list = $('#room-list');
  $('#room-count').textContent = `${state.rooms.length} ${state.rooms.length === 1 ? 'added' : 'added'}`;
  if (!state.rooms.length) {
    list.innerHTML = '<div class="empty-rooms">You haven’t added any rooms yet.</div>';
    return;
  }
  list.innerHTML = state.rooms.map((room, index) => `<div class="room-row"><span>${escapeHtml(room.name)} <small>· ${escapeHtml(room.type)}</small></span><span>${room.area.toLocaleString('en-GB')} m²</span><button type="button" class="remove-room" data-remove-room="${index}" aria-label="Remove ${escapeHtml(room.name)}">×</button></div>`).join('');
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
  if (!Number.isFinite(area) || area < 1 || area > 250) { $('#room-area').focus(); alert('Enter an area between 1 and 250 m².'); return; }
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
    alert('Please confirm that you understand how this demo handles the video.');
    event.target.value = '';
    return;
  }
  if (!file.type.startsWith('video/')) { alert('Please select a video file.'); event.target.value = ''; return; }
  if (file.size > 300 * 1024 * 1024) { alert('For this demo, the video must be smaller than 300 MB.'); event.target.value = ''; return; }
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
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function lineForRoom(room) {
  if (room.type === 'Kitchen') return { title: `Update finishes in ${room.name.toLowerCase()}`, low: room.area * 280, high: room.area * 650, detail: 'Illustrative area-based estimate. Appliances, layout changes, and full service replacements are not included.' };
  if (room.type === 'Bathroom') return { title: `Update finishes in ${room.name.toLowerCase()}`, low: room.area * 350, high: room.area * 800, detail: 'Illustrative estimate. Plumbing, waterproofing, and existing conditions can significantly affect cost.' };
  return { title: `Painting and finishes in ${room.name.toLowerCase()}`, low: room.area * 45, high: room.area * 130, detail: 'Cosmetic improvement while keeping the existing layout. The range depends on condition and materials.' };
}

function prioritySuggestion(priority) {
  const suggestions = {
    'More natural light': 'Consider light colours, lightweight curtains, and keeping light paths clear; check orientation and openings before planning construction.',
    'More storage': 'Look for vertical storage and use corners without blocking windows, walkways, or radiators.',
    'Better layout': 'Compare furniture and circulation options. Do not assume a partition wall can be removed.',
    'More room to work': 'Set aside a workspace with suitable lighting, a nearby power outlet, and compact storage.',
    'Improve energy efficiency': 'Start by checking windows, insulation, and heating or cooling; do not infer performance from appearance.',
    'Update finishes': 'Try a consistent palette and compare materials with different maintenance needs and durability.'
  };
  return suggestions[priority] || 'Review this priority when comparing layout and finish options.';
}

function generateProposal() {
  if (!state.rooms.length) { alert('Add at least one room with an area to prepare a proposal.'); return; }
  const projectName = $('#project-name').value.trim() || 'My new home';
  const city = $('#city').value.trim() || 'Area not specified';
  const budget = Number($('#budget').value);
  if (!Number.isFinite(budget) || budget < 1000) { alert('Enter a valid budget.'); goToStep(1); $('#budget').focus(); return; }
  const style = $('input[name="style"]:checked').value;
  const priorities = $$('input[name="priority"]:checked').map(input => input.value);
  const lines = state.rooms.map(lineForRoom);
  const totalLow = lines.reduce((sum, line) => sum + line.low, 0);
  const totalHigh = lines.reduce((sum, line) => sum + line.high, 0);
  const totalArea = state.rooms.reduce((sum, room) => sum + room.area, 0);
  const lowWithContingency = totalLow * 1.15;
  const highWithContingency = totalHigh * 1.15;
  const prioritiesHtml = priorities.length ? priorities.map(priority => `<div class="plan-item"><span class="plan-num">✓</span><div class="plan-copy"><b>${escapeHtml(priority)}</b><p>${escapeHtml(prioritySuggestion(priority))}</p></div></div>`).join('') : '<p class="footnote">You haven’t selected specific priorities yet; this proposal is based on the chosen style and rooms.</p>';
  const overBudget = budget < lowWithContingency;
  const warnings = [
    'Areas are user-entered; they have not been measured from the video.',
    'Structure, hidden utilities, damp, regulations, and permits have not been checked.',
    'Prices are fictional ranges for testing the interface. They are not local prices or professional quotes.'
  ];
  if (overBudget) warnings.unshift('The stated limit is below the low end of this simulation. Reduce the scope or request quotes in phases.');
  const proposal = `
    <div class="proposal-header"><div><div class="eyebrow small">INITIAL OVERVIEW · ${escapeHtml(city.toUpperCase())}</div><h2>${escapeHtml(projectName)}</h2><p>${escapeHtml(style)} · ${totalArea.toLocaleString('en-GB')} m² entered · ${state.rooms.length} rooms</p></div><span class="concept-tag">CONCEPT, NOT A PROJECT</span></div>
    <div class="proposal-grid"><div class="metric-card"><div class="metric-label">Simulated range</div><div class="metric-value">${currency(totalLow)} – ${currency(totalHigh)}</div><div class="metric-sub">With a 15% exploratory contingency: ${currency(lowWithContingency)} – ${currency(highWithContingency)}.</div></div><div class="metric-card"><div class="metric-label">Your approximate limit</div><div class="metric-value">${currency(budget)}</div><div class="metric-sub">${overBudget ? 'The simulated scope exceeds the limit even at its minimum.' : 'This does not mean prices are validated or the scope is final.'}</div></div></div>
    <section class="proposal-section"><h3>Possible room-by-room plan</h3>${lines.map((line, index) => `<div class="plan-item"><span class="plan-num">${String(index + 1).padStart(2, '0')}</span><div class="plan-copy"><b>${escapeHtml(line.title)}</b><p>${escapeHtml(line.detail)}</p></div><span class="plan-cost">${currency(line.low)}–${currency(line.high)}</span></div>`).join('')}</section>
    <section class="proposal-section"><h3>Design direction</h3><div class="style-summary"><b>${escapeHtml(style)}:</b> use it as a starting point, not a rigid label. Compare references for materials, lighting, and furniture that you like. To truly personalise the result, a future version should ask you to rate example images; this demo does not learn your tastes or generate renders yet.</div></section>
    <section class="proposal-section"><h3>Your priorities, translated into decisions</h3>${prioritiesHtml}</section>
    <section class="proposal-section"><h3>Checks before hiring</h3><div class="alert-list">${warnings.map(text => `<p><span class="alert-mark">!</span><span>${escapeHtml(text)}</span></p>`).join('')}</div><p class="footnote">These figures have not been checked against a regional price catalogue, site visit, or professional assessment. Request an inspection and itemised quotes before starting work.</p></section>`;
  $('#proposal-content').innerHTML = proposal;
  goToStep(3);
}
$('#generate-plan').addEventListener('click', generateProposal);
$('#print-plan').addEventListener('click', () => window.print());

// Keep the video selection explicit; never trigger camera or upload automatically.
$('#video-consent').addEventListener('change', event => {
  if (!event.target.checked) clearVideo();
});
