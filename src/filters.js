// ═══════════════════════════════════════════════
// FILTER STATE
// ═══════════════════════════════════════════════

const STATE = {
  activeTab: 'tab1',
  tab1: { venue: 'all', dateRange: 'full_year', customStart: null, customEnd: null, channel: 'all', accountStatus: 'all' },
  tab2: { venue: 'all', dateRange: 'full_year', customStart: null, customEnd: null, eventType: 'all', seatCategory: 'all' },
  tab3: { venue: 'all', dateRange: 'full_year', customStart: null, customEnd: null, fnbCategory: 'all', visitType: 'all' },
  tab4: { venue: 'all', dateRange: 'full_year', customStart: null, customEnd: null, segment: 'all_linked', linkedStatus: 'linked_only' },
};

const DATE_PRESETS = {
  last_30:      () => { const e=new Date('2025-12-31'); const s=new Date(e); s.setDate(s.getDate()-30); return [s,e]; },
  last_90:      () => { const e=new Date('2025-12-31'); const s=new Date(e); s.setDate(s.getDate()-90); return [s,e]; },
  current_season: () => [new Date('2025-01-01'), new Date('2025-12-31')],
  full_year:    () => [new Date('2025-01-01'), new Date('2025-12-31')],
};

function getDateWindow(filters) {
  if (filters.dateRange === 'custom' && filters.customStart && filters.customEnd) {
    return [new Date(filters.customStart), new Date(filters.customEnd)];
  }
  return (DATE_PRESETS[filters.dateRange] || DATE_PRESETS.full_year)();
}

function filterDaily(dailyArr, filters) {
  const [start, end] = getDateWindow(filters);
  return dailyArr.filter(r => {
    const d = new Date(r.date);
    if (d < start || d > end) return false;
    if (filters.venue !== 'all' && r.venue !== filters.venue) return false;
    return true;
  });
}

function filterFans(filters, tab) {
  return FANS.filter(f => {
    if (filters.venue !== 'all') {
      const fanVenues = [f.adw_venue, f.ticket_venue, f.fnb_venue].filter(Boolean);
      if (!fanVenues.includes(filters.venue)) return false;
    }
    if (tab === 'tab1') {
      if (!f.adw_fan_id) return false;
      if (filters.channel !== 'all' && f.adw_channel !== filters.channel) return false;
      if (filters.accountStatus !== 'all' && f.adw_account_status !== filters.accountStatus) return false;
    }
    if (tab === 'tab2') {
      if (!f.ticketing_fan_id) return false;
      if (filters.seatCategory !== 'all' && f.seat_category !== filters.seatCategory) return false;
    }
    if (tab === 'tab3') {
      if (!f.fnb_fan_id) return false;
      if (filters.fnbCategory !== 'all' && f.fnb_top_category !== filters.fnbCategory) return false;
    }
    if (tab === 'tab4') {
      if (filters.linkedStatus === 'linked_only' && !f.global_fan_id) return false;
      if (filters.segment === 'top10pct') {
        const threshold = getTop10PctThreshold();
        if (f.total_cross_channel_spend < threshold) return false;
      }
      if (filters.segment === 'single_source') {
        if (f.linked_sources.includes('|')) return false;
      }
    }
    return true;
  });
}

function getTop10PctThreshold() {
  const linkedFans = FANS.filter(f => f.global_fan_id);
  const sorted = [...linkedFans].sort((a,b) => b.total_cross_channel_spend - a.total_cross_channel_spend);
  return sorted[Math.floor(sorted.length * 0.10)]?.total_cross_channel_spend ?? 0;
}

const fmt = {
  currency: n => '$' + (n >= 1_000_000 ? (n/1_000_000).toFixed(1)+'M' : n >= 1000 ? (n/1000).toFixed(0)+'K' : n.toFixed(0)),
  pct:      n => (n*100).toFixed(1) + '%',
  num:      n => n >= 1000 ? (n/1000).toFixed(1)+'K' : String(n),
  delta:    (curr, prev) => {
    if (!prev) return '';
    const pct = ((curr - prev) / prev * 100).toFixed(1);
    return (curr >= prev ? '▲ ' : '▼ ') + Math.abs(pct) + '% vs prior period';
  },
};

console.assert(filterDaily(DAILY_ADW, STATE.tab1).length === 1095, 'filterDaily full_year should return all rows');
console.assert(filterFans(STATE.tab1, 'tab1').length > 0, 'filterFans tab1 should return ADW fans');
console.log('FILTERS OK');
