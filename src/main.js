// ═══════════════════════════════════════════════
// TAB NAVIGATION
// ═══════════════════════════════════════════════

function switchTab(tabId) {
  STATE.activeTab = tabId;
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
  renderTab(tabId);
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// ═══════════════════════════════════════════════
// BAN RENDERING
// ═══════════════════════════════════════════════

function renderBANs(containerId, banDefs) {
  const container = document.getElementById(containerId);
  container.innerHTML = banDefs.map(({ label, value, delta, lead, tooltip }) => `
    <div class="ban-card ${lead ? 'lead' : ''}"
         ${tooltip ? `data-tooltip="${tooltip}"` : ''}>
      <div class="ban-label">${label}</div>
      <div class="ban-value">${value}</div>
      ${delta ? `<div class="ban-delta ${delta.startsWith('▲') ? 'pos' : 'neg'}">${delta}</div>` : ''}
    </div>
  `).join('');
}

// ═══════════════════════════════════════════════
// FILTER WIRING
// ═══════════════════════════════════════════════

function wireFilter(elId, stateTab, stateKey) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.addEventListener('change', () => {
    STATE[stateTab][stateKey] = el.value;
    renderTab(STATE.activeTab);
  });
}

// Tab 1 filters
wireFilter('t1-venue',         'tab1', 'venue');
wireFilter('t1-dateRange',     'tab1', 'dateRange');
wireFilter('t1-channel',       'tab1', 'channel');
wireFilter('t1-accountStatus', 'tab1', 'accountStatus');

// Tab 2 filters
wireFilter('t2-venue',       'tab2', 'venue');
wireFilter('t2-dateRange',   'tab2', 'dateRange');
wireFilter('t2-eventType',   'tab2', 'eventType');
wireFilter('t2-seatCategory','tab2', 'seatCategory');

// Tab 3 filters
wireFilter('t3-venue',       'tab3', 'venue');
wireFilter('t3-dateRange',   'tab3', 'dateRange');
wireFilter('t3-fnbCategory', 'tab3', 'fnbCategory');
wireFilter('t3-visitType',   'tab3', 'visitType');

// Tab 4 filters
wireFilter('t4-venue',       'tab4', 'venue');
wireFilter('t4-dateRange',   'tab4', 'dateRange');
wireFilter('t4-segment',     'tab4', 'segment');
wireFilter('t4-linkedStatus','tab4', 'linkedStatus');

// Reset buttons
const TAB_DEFAULTS = {
  tab1: { venue:'all', dateRange:'full_year', customStart:null, customEnd:null, channel:'all', accountStatus:'all' },
  tab2: { venue:'all', dateRange:'full_year', customStart:null, customEnd:null, eventType:'all', seatCategory:'all' },
  tab3: { venue:'all', dateRange:'full_year', customStart:null, customEnd:null, fnbCategory:'all', visitType:'all' },
  tab4: { venue:'all', dateRange:'full_year', customStart:null, customEnd:null, segment:'all_linked', linkedStatus:'linked_only' },
};

function resetTab(tabId) {
  Object.assign(STATE[tabId], TAB_DEFAULTS[tabId]);
  document.querySelectorAll(`#${tabId} .filter-select`).forEach(sel => {
    sel.value = STATE[tabId][sel.id.replace(`t${tabId.slice(-1)}-`, '')] || 'all';
  });
  renderTab(tabId);
}

document.getElementById('t1-reset').addEventListener('click', () => resetTab('tab1'));
document.getElementById('t2-reset').addEventListener('click', () => resetTab('tab2'));
document.getElementById('t3-reset').addEventListener('click', () => resetTab('tab3'));
document.getElementById('t4-reset').addEventListener('click', () => resetTab('tab4'));

// ═══════════════════════════════════════════════
// CHART TOOLTIP INJECTION
// ═══════════════════════════════════════════════

function applyChartTooltips() {
  Object.entries(CHART_TOOLTIPS).forEach(([canvasId, tipText]) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const card = canvas.closest('.chart-card');
    if (!card) return;
    const titleEl = card.querySelector('.chart-title');
    if (!titleEl || titleEl.querySelector('.chart-info-icon')) return;
    const icon = document.createElement('span');
    icon.className = 'chart-info-icon';
    icon.setAttribute('data-tooltip', tipText);
    icon.textContent = 'ⓘ';
    titleEl.appendChild(icon);
  });
}

// ═══════════════════════════════════════════════
// RENDER DISPATCHER
// ═══════════════════════════════════════════════

function renderTab(tabId) {
  if (tabId === 'tab1') renderTab1();
  else if (tabId === 'tab2') renderTab2();
  else if (tabId === 'tab3') renderTab3();
  else if (tabId === 'tab4') renderTab4();
  applyChartTooltips();
}

// Initial render
renderTab('tab1');

// ── Final startup assertions ──
(function smokeTest() {
  const errors = [];
  if (DAILY_ADW.length !== 1095) errors.push('DAILY_ADW count wrong');
  if (FANS.length !== 500) errors.push('FANS count wrong');
  if (FANS.filter(f=>f.global_fan_id).length !== 389) errors.push('Linked fan count wrong');
  const t4Fans = filterFans(STATE.tab4, 'tab4');
  if (t4Fans.length === 0) errors.push('Tab 4 returns no fans on default filters');
  if (errors.length) {
    console.error('SMOKE TEST FAILURES:', errors);
  } else {
    console.log('✓ All startup checks passed');
  }
})();
