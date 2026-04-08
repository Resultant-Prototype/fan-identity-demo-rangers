// ═══════════════════════════════════════════════
// DATA LAYER
// ═══════════════════════════════════════════════

const VENUES = ['Belmore Park', 'Saratoga Downs', 'Aqueduct Hills'];

const EVENTS = [
  { id: 'E1', name: 'Belmore Stakes',           venue: 'Belmore Park',   date: '2025-05-17', tickets: 14200, handle_spike: 2.4 },
  { id: 'E2', name: 'Spring Sprint Classic',     venue: 'Belmore Park',   date: '2025-06-14', tickets: 9800,  handle_spike: 1.8 },
  { id: 'E3', name: 'Saratoga Classic',          venue: 'Saratoga Downs', date: '2025-07-26', tickets: 18500, handle_spike: 2.6 },
  { id: 'E4', name: 'Midsummer Championship',    venue: 'Saratoga Downs', date: '2025-08-16', tickets: 15200, handle_spike: 2.1 },
  { id: 'E5', name: 'Belmore Fall Invitational', venue: 'Belmore Park',   date: '2025-09-27', tickets: 11400, handle_spike: 1.9 },
  { id: 'E6', name: 'Hills Championship',        venue: 'Aqueduct Hills', date: '2025-10-25', tickets: 13800, handle_spike: 2.3 },
  { id: 'E7', name: 'Winter Classic',            venue: 'Aqueduct Hills', date: '2025-12-13', tickets: 10200, handle_spike: 1.7 },
  { id: 'E8', name: 'New Year Stakes',           venue: 'Aqueduct Hills', date: '2026-01-24', tickets: 9400,  handle_spike: 1.6 },
];

const SEASONALITY = {
  'Saratoga Downs': [0.10, 0.10, 0.15, 0.20, 0.35, 0.55, 1.00, 0.90, 0.40, 0.15, 0.10, 0.10],
  'Belmore Park':   [0.30, 0.30, 0.50, 0.70, 1.00, 0.90, 0.40, 0.30, 0.80, 0.60, 0.30, 0.20],
  'Aqueduct Hills': [0.90, 0.80, 0.60, 0.40, 0.30, 0.20, 0.10, 0.10, 0.30, 1.00, 0.85, 0.75],
};

function deterministicVariance(dateStr, venue, salt = 0) {
  let h = salt;
  for (const c of (dateStr + venue)) h = (h * 31 + c.charCodeAt(0)) & 0xFFFFFFFF;
  return 0.88 + ((h >>> 0) % 240) / 1000;
}

const BASE_HANDLE = { 'Belmore Park': 1_800_000, 'Saratoga Downs': 2_100_000, 'Aqueduct Hills': 1_600_000 };
const BASE_ACCTS  = { 'Belmore Park': 9_000, 'Saratoga Downs': 11_000, 'Aqueduct Hills': 8_000 };
const MARQUEE_DATES = new Set(EVENTS.map(e => e.date));
const EVENT_BY_DATE = Object.fromEntries(EVENTS.map(e => [e.date, e]));

function generateDailyADW() {
  const rows = [];
  const start = new Date('2025-01-01');
  const end   = new Date('2025-12-31');
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    const mo = d.getMonth();
    for (const venue of VENUES) {
      const season = SEASONALITY[venue][mo];
      const v = deterministicVariance(dateStr, venue, 1);
      const event = EVENT_BY_DATE[dateStr];
      const spike = (event && event.venue === venue) ? event.handle_spike : 1;
      const handle = Math.round(BASE_HANDLE[venue] * season * v * spike);
      const mobile_share = 0.62 + deterministicVariance(dateStr, venue, 2) * 0.1 - 0.05;
      rows.push({
        date: dateStr,
        venue,
        handle,
        deposits:         Math.round(handle * 0.145),
        withdrawals:      Math.round(handle * 0.076),
        mobile_handle:    Math.round(handle * mobile_share),
        web_handle:       Math.round(handle * (1 - mobile_share)),
        active_accounts:  Math.round(BASE_ACCTS[venue] * season * deterministicVariance(dateStr, venue, 3)),
        new_registrations:Math.round(28 * season * deterministicVariance(dateStr, venue, 4)),
        is_marquee: MARQUEE_DATES.has(dateStr) && EVENT_BY_DATE[dateStr]?.venue === venue,
        event_id: (MARQUEE_DATES.has(dateStr) && EVENT_BY_DATE[dateStr]?.venue === venue)
                    ? EVENT_BY_DATE[dateStr].id : null,
      });
    }
  }
  return rows;
}

const DAILY_ADW = generateDailyADW();

console.assert(DAILY_ADW.length === 365 * 3, 'DAILY_ADW should have 1095 rows');
const totalHandle = DAILY_ADW.reduce((s, r) => s + r.handle, 0);
console.assert(totalHandle > 200_000_000 && totalHandle < 400_000_000,
  `Total handle ${totalHandle} out of $200M–$400M range`);
console.log('DAILY_ADW OK — total handle $' + (totalHandle / 1e6).toFixed(1) + 'M');

const BASE_TKT_REV = { 'Belmore Park': 360_000, 'Saratoga Downs': 420_000, 'Aqueduct Hills': 280_000 };
const BASE_ATTACH  = { 'Belmore Park': 0.68, 'Saratoga Downs': 0.71, 'Aqueduct Hills': 0.63 };

function generateDailyTickets() {
  const rows = [];
  const start = new Date('2025-01-01');
  const end   = new Date('2025-12-31');
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    const mo = d.getMonth();
    for (const venue of VENUES) {
      const season = SEASONALITY[venue][mo];
      const v = deterministicVariance(dateStr, venue, 10);
      const event = EVENT_BY_DATE[dateStr];
      const isMarquee = event && event.venue === venue;
      const spike = isMarquee ? 6.5 : 1;
      const gross = Math.round(BASE_TKT_REV[venue] * season * v * spike);
      const premRatio = isMarquee ? 0.55 : 0.38;
      rows.push({
        date: dateStr, venue,
        gross_revenue:      gross,
        premium_revenue:    Math.round(gross * premRatio),
        general_revenue:    Math.round(gross * (1 - premRatio)),
        tickets_sold:       Math.round(gross / (isMarquee ? 80 : 65)),
        unique_purchasers:  Math.round(gross / (isMarquee ? 96 : 78)),
        is_marquee: !!isMarquee,
        event_id: isMarquee ? event.id : null,
        event_name: isMarquee ? event.name : null,
      });
    }
  }
  return rows;
}

const BASE_FNB_PERCAP = { 'Belmore Park': 38, 'Saratoga Downs': 45, 'Aqueduct Hills': 32 };

function generateDailyFnB() {
  const rows = [];
  const start = new Date('2025-01-01');
  const end   = new Date('2025-12-31');
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    const mo = d.getMonth();
    for (const venue of VENUES) {
      const season = SEASONALITY[venue][mo];
      const v = deterministicVariance(dateStr, venue, 20);
      const event = EVENT_BY_DATE[dateStr];
      const isMarquee = event && event.venue === venue;
      const tickRow = DAILY_TICKETS
        ? DAILY_TICKETS.find(r => r.date === dateStr && r.venue === venue)
        : null;
      const visitors = tickRow ? Math.round(tickRow.tickets_sold * BASE_ATTACH[venue]) : Math.round(500 * season * v);
      const percap = BASE_FNB_PERCAP[venue] * (isMarquee ? 1.22 : 1) * deterministicVariance(dateStr, venue, 21);
      const total = Math.round(visitors * percap);
      rows.push({
        date: dateStr, venue,
        total_revenue:      total,
        food_revenue:       Math.round(total * 0.44),
        beer_wine_revenue:  Math.round(total * 0.38),
        non_alc_revenue:    Math.round(total * 0.18),
        transaction_count:  Math.round(visitors * 1.9),
        unique_visitors_with_fnb: visitors,
        is_marquee: !!isMarquee,
        event_id: isMarquee ? event.id : null,
      });
    }
  }
  return rows;
}

const DAILY_TICKETS = generateDailyTickets();
const DAILY_FNB     = generateDailyFnB();

console.assert(DAILY_TICKETS.length === 1095, 'DAILY_TICKETS row count');
console.assert(DAILY_FNB.length === 1095, 'DAILY_FNB row count');
const totalTktRev = DAILY_TICKETS.reduce((s, r) => s + r.gross_revenue, 0);
console.log('DAILY_TICKETS OK — total ticket rev $' + (totalTktRev / 1e6).toFixed(1) + 'M');

// NYRA fan base is overwhelmingly NY-based (~80%), with NJ/CT/PA/FL as secondary markets
const US_STATES = ['NY','NJ','CT','PA','FL','MA','MD','OH','VA','CA','TX','IL','NC','GA','MI'];
const STATE_WEIGHTS = [200,15,8,6,5,4,2,2,1,1,1,1,1,1,1];
const VIP_TIERS = ['standard','silver','gold','platinum'];
const CATEGORIES = ['food','beer_wine','non_alc'];

function weightedPick(items, weights, seed) {
  const total = weights.reduce((a,b) => a+b, 0);
  let h = seed;
  for (let i = 0; i < 3; i++) h = (h * 1664525 + 1013904223) & 0xFFFFFFFF;
  const r = (h >>> 0) % total;
  let cum = 0;
  for (let i = 0; i < items.length; i++) { cum += weights[i]; if (r < cum) return items[i]; }
  return items[items.length - 1];
}

const SEGMENTS = [
  { count: 157, sources: ['ADW','TICKET','FNB'], linked: true },
  { count: 111, sources: ['ADW','TICKET'],        linked: true },
  { count:  83, sources: ['ADW','FNB'],           linked: true },
  { count:  38, sources: ['TICKET','FNB'],        linked: true },
  { count:  51, sources: ['ADW'],                 linked: false },
  { count:  34, sources: ['TICKET'],              linked: false },
  { count:  26, sources: ['FNB'],                 linked: false },
];

function generateFans() {
  const fans = [];
  let fanIdx = 0;
  for (const seg of SEGMENTS) {
    for (let i = 0; i < seg.count; i++, fanIdx++) {
      const seed = fanIdx * 7919 + 42;
      const state = weightedPick(US_STATES, STATE_WEIGHTS, seed);
      const venue = VENUES[seed % 3];
      const isADW    = seg.sources.includes('ADW');
      const isTicket = seg.sources.includes('TICKET');
      const isFnB    = seg.sources.includes('FNB');
      const adwHandle = isADW ? 500 + (seed % 49500) : null;
      const tier = isADW ? VIP_TIERS[Math.min(3, Math.floor((adwHandle || 0) / 15000))] : null;
      const ticketEvents = isTicket ? 1 + (seed % 7) : null;
      const ticketSpend  = isTicket ? Math.round(ticketEvents * (65 + (seed % 120))) : null;
      const fnbVisits    = isFnB ? 1 + (seed % 10) : null;
      const fnbSpend     = isFnB ? Math.round(fnbVisits * (28 + (seed % 30))) : null;
      const xcs = (adwHandle || 0) + (ticketSpend || 0) + (fnbSpend || 0);
      fans.push({
        adw_fan_id:        isADW    ? `ADW-${String(fanIdx+1).padStart(6,'0')}` : null,
        ticketing_fan_id:  isTicket ? `TKT-${String(fanIdx+1).padStart(6,'0')}` : null,
        fnb_fan_id:        isFnB    ? `FNB-${String(fanIdx+1).padStart(6,'0')}` : null,
        global_fan_id:     seg.linked ? `GF-${String(fanIdx+1).padStart(6,'0')}` : null,
        linked_sources:    seg.sources.join('|'),
        match_confidence_score: seg.linked ? 0.85 + (seed % 14) / 100 : null,
        adw_handle:         adwHandle,
        adw_wager_count:    isADW ? 5 + (seed % 180) : null,
        adw_deposits:       isADW ? Math.round((adwHandle || 0) * 1.12) : null,
        adw_withdrawals:    isADW ? Math.round((adwHandle || 0) * 0.58) : null,
        adw_channel:        isADW ? (seed % 3 === 0 ? 'web' : 'mobile') : null,
        adw_account_status: isADW ? ['active_30','active_60','active_90','inactive'][seed % 4] : null,
        adw_days_active:    isADW ? 10 + (seed % 340) : null,
        adw_state:          isADW ? state : null,
        adw_venue:          isADW ? venue : null,
        adw_vip_tier:       tier,
        ticket_spend:       ticketSpend,
        tickets_purchased:  isTicket ? ticketEvents * (1 + (seed % 3)) : null,
        events_attended:    ticketEvents,
        seat_category:      isTicket ? (seed % 4 === 0 ? 'premium' : 'general') : null,
        repeat_buyer:       isTicket ? ticketEvents > 1 : null,
        ticket_state:       isTicket ? state : null,
        ticket_venue:       isTicket ? venue : null,
        fnb_spend:           fnbSpend,
        fnb_transactions:    isFnB ? fnbVisits * (1 + (seed % 3)) : null,
        fnb_avg_transaction: isFnB ? Math.round((fnbSpend || 0) / Math.max(1, fnbVisits * (1 + (seed % 3)))) : null,
        fnb_top_category:    isFnB ? CATEGORIES[seed % 3] : null,
        fnb_attach_flag:     isFnB,
        fnb_visit_count:     fnbVisits,
        fnb_venue:           isFnB ? venue : null,
        total_cross_channel_spend: xcs,
        primary_venue: venue,
        home_state: state,
      });
    }
  }
  return fans;
}

const FANS = generateFans();

console.assert(FANS.length === 500, 'FANS should have 500 records');
const linked = FANS.filter(f => f.global_fan_id !== null);
console.assert(linked.length === 389, `Linked fans: ${linked.length} (expected 389)`);
const avgConf = linked.reduce((s,f) => s + f.match_confidence_score, 0) / linked.length;
console.assert(avgConf > 0.88 && avgConf < 0.99, `Avg confidence ${avgConf}`);
console.log(`FANS OK — 500 fans, ${linked.length} linked, avg confidence ${(avgConf*100).toFixed(1)}%`);
