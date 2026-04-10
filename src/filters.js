// ═══════════════════════════════════════════════
// FILTER STATE
// ═══════════════════════════════════════════════

const STATE = {
  activeTab:     'tab1',
  opponent:      'all',       // global — 'all' | any opponent string from GAMES
  showSeasonAvg: true,        // global toggle — only relevant when opponent !== 'all'
  tab1: { dateRange: 'full_season', dayType: 'all', promo: 'all' },
  tab2: { dateRange: 'full_season', dayType: 'all', ticketType: 'all' },
  tab3: { dateRange: 'full_season', dayType: 'all', fnbCategory: 'all' },
  tab4: { dateRange: 'full_season', segment: 'all_linked', linkedStatus: 'linked_only' },
};

// Date range buckets — keyed to 2025 Rangers season
const DATE_PRESETS = {
  full_season:  () => [new Date('2025-03-31'), new Date('2025-09-28')],
  first_half:   () => [new Date('2025-03-31'), new Date('2025-06-30')],
  second_half:  () => [new Date('2025-07-01'), new Date('2025-09-28')],
  last_30_games:() => {
    const all = [...GAMES].sort((a,b) => a.date.localeCompare(b.date));
    const cutoff = all[Math.max(0, all.length - 30)].date;
    return [new Date(cutoff), new Date('2025-09-28')];
  },
};

function getDateWindow(dateRange) {
  return (DATE_PRESETS[dateRange] || DATE_PRESETS.full_season)();
}

// filterGames — returns { mode, focused, baseline }
// mode='all'     → focused = all games matching tab filters, baseline = null
// mode='focused' → focused = opponent-matching games, baseline = all other games (for season avg)
function filterGames(tabFilters) {
  const [start, end] = getDateWindow(tabFilters.dateRange);

  // Apply tab-specific filters (dateRange, dayType, promo/ticketType/fnbCategory)
  let games = GAMES.filter(g => {
    const d = new Date(g.date);
    if (d < start || d > end) return false;
    if (tabFilters.dayType && tabFilters.dayType !== 'all' && g.day_type !== tabFilters.dayType) return false;
    if (tabFilters.promo && tabFilters.promo !== 'all') {
      if (tabFilters.promo === 'no_promo' && g.promo_type !== null) return false;
      if (tabFilters.promo !== 'no_promo' && g.promo_type !== tabFilters.promo) return false;
    }
    return true;
  });

  if (STATE.opponent === 'all') {
    return { mode: 'all', focused: games, baseline: null };
  }

  const focused  = games.filter(g => g.opponent === STATE.opponent);
  const baseline = games.filter(g => g.opponent !== STATE.opponent);
  return { mode: 'focused', focused, baseline };
}

// Lookup game-level data rows by game_id
function getTicketRows(gameIds) {
  const idSet = new Set(gameIds);
  return GAME_TICKETS.filter(r => idSet.has(r.game_id));
}
function getScanRows(gameIds) {
  const idSet = new Set(gameIds);
  return GAME_SCANS.filter(r => idSet.has(r.game_id));
}
function getFnbRows(gameIds) {
  const idSet = new Set(gameIds);
  return GAME_FNB.filter(r => idSet.has(r.game_id));
}

// filterFans — filters the FANS array for Tab 2, 3, 4 fan-level charts
function filterFans(tabFilters, tab) {
  return FANS.filter(f => {
    if (tab === 'tab2') {
      if (!f.ticketing_fan_id) return false;
      if (tabFilters.ticketType !== 'all' && f.ticket_type !== tabFilters.ticketType) return false;
    }
    if (tab === 'tab3') {
      if (!f.fnb_fan_id) return false;
      if (tabFilters.fnbCategory !== 'all' && f.fnb_top_category !== tabFilters.fnbCategory) return false;
    }
    if (tab === 'tab4') {
      if (tabFilters.linkedStatus === 'linked_only' && !f.global_fan_id) return false;
      if (tabFilters.segment === 'top10pct') {
        if (f.total_cross_channel_spend < getTop10PctThreshold()) return false;
      }
      if (tabFilters.segment === 'single_source') {
        if (f.linked_sources.includes('|')) return false;
      }
    }
    return true;
  });
}

// Formatting helpers (same as Belmont)
const fmt = {
  currency: n => '$' + (n >= 1_000_000 ? (n/1_000_000).toFixed(1)+'M' : n >= 1000 ? (n/1000).toFixed(0)+'K' : n.toFixed(0)),
  pct:      n => (n * 100).toFixed(1) + '%',
  num:      n => n >= 1000 ? (n/1000).toFixed(1)+'K' : String(Math.round(n)),
};

// Smoke tests
console.assert(filterGames(STATE.tab1).focused.length === 81, 'filterGames full_season should return 81 games');
console.assert(filterFans(STATE.tab4, 'tab4').length === 362, 'filterFans tab4 linked_only should return 362');
console.log('FILTERS OK');
