// ═══════════════════════════════════════════════
// DATA LAYER — Texas Rangers 2025 Home Schedule
// ═══════════════════════════════════════════════

// Deterministic variance — same pattern as Belmont, no Math.random()
function deterministicVariance(key, salt = 0) {
  let h = salt;
  for (const c of String(key)) h = (h * 31 + c.charCodeAt(0)) & 0xFFFFFFFF;
  return 0.88 + ((h >>> 0) % 240) / 1000;
}

function weightedPick(items, weights, seed) {
  const total = weights.reduce((a, b) => a + b, 0);
  let h = seed;
  for (let i = 0; i < 3; i++) h = (h * 1664525 + 1013904223) & 0xFFFFFFFF;
  const r = (h >>> 0) % total;
  let cum = 0;
  for (let i = 0; i < items.length; i++) { cum += weights[i]; if (r < cum) return items[i]; }
  return items[items.length - 1];
}

// ── 2025 Home Schedule — 81 games across 26 series ──────────────
// n values: 21+13+13+12+13+9 = 81 ✓
const SERIES_SCHEDULE = [
  // March / April — 21 games
  { start:'2025-03-31', opp:'Chicago Cubs',        lg:'NL', rival:false, n:3, tier:'featured', promo:'giveaway',    promoLabel:'Opening Day Magnetic Schedule — presented by Budweiser' },
  { start:'2025-04-04', opp:'Los Angeles Dodgers', lg:'NL', rival:false, n:3, tier:'featured', promo:'giveaway',    promoLabel:'2023 World Series Rematch Replica Ring' },
  { start:'2025-04-08', opp:'Houston Astros',      lg:'AL', rival:true,  n:3, tier:'featured', promo:'theme_night', promoLabel:'Lone Star Derby Night' },
  { start:'2025-04-14', opp:'Seattle Mariners',    lg:'AL', rival:true,  n:3, tier:'select',   promo:null,          promoLabel:null },
  { start:'2025-04-18', opp:'Milwaukee Brewers',   lg:'NL', rival:false, n:3, tier:'select',   promo:'theme_night', promoLabel:'Faith & Family Night' },
  { start:'2025-04-22', opp:'Los Angeles Angels',  lg:'AL', rival:true,  n:3, tier:'select',   promo:'giveaway',    promoLabel:'Retro Jersey Giveaway' },
  { start:'2025-04-25', opp:'Boston Red Sox',      lg:'AL', rival:false, n:3, tier:'select',   promo:null,          promoLabel:null },
  // May — 13 games
  { start:'2025-05-05', opp:'Minnesota Twins',     lg:'AL', rival:false, n:3, tier:'select',   promo:'theme_night', promoLabel:'College Night' },
  { start:'2025-05-09', opp:'Houston Astros',      lg:'AL', rival:true,  n:3, tier:'featured', promo:'giveaway',    promoLabel:'Lone Star Member Bobblehead — presented by H-E-B' },
  { start:'2025-05-16', opp:'Seattle Mariners',    lg:'AL', rival:true,  n:3, tier:'select',   promo:null,          promoLabel:null },
  { start:'2025-05-23', opp:'Baltimore Orioles',   lg:'AL', rival:false, n:4, tier:'select',   promo:'giveaway',    promoLabel:'Replica Championship Banner' },
  // June — 13 games
  { start:'2025-06-06', opp:'Cleveland Guardians', lg:'AL', rival:false, n:3, tier:'select',   promo:'giveaway',    promoLabel:'Youth Baseball Cap Giveaway' },
  { start:'2025-06-09', opp:'Toronto Blue Jays',   lg:'AL', rival:false, n:3, tier:'standard', promo:null,          promoLabel:null },
  { start:'2025-06-13', opp:'Chicago White Sox',   lg:'AL', rival:false, n:3, tier:'standard', promo:'theme_night', promoLabel:'Whataburger Night' },
  { start:'2025-06-20', opp:'Athletics',           lg:'AL', rival:true,  n:4, tier:'standard', promo:'giveaway',    promoLabel:'Corey Seager Bobblehead' },
  // July — 12 games
  { start:'2025-07-03', opp:'Houston Astros',      lg:'AL', rival:true,  n:3, tier:'featured', promo:'theme_night', promoLabel:'July 4th Fireworks Spectacular' },
  { start:'2025-07-07', opp:'Los Angeles Angels',  lg:'AL', rival:true,  n:3, tier:'select',   promo:'giveaway',    promoLabel:'Custom Rangers Tumbler' },
  { start:'2025-07-18', opp:'Seattle Mariners',    lg:'AL', rival:true,  n:3, tier:'select',   promo:'theme_night', promoLabel:'DFW Night' },
  { start:'2025-07-25', opp:'New York Mets',       lg:'NL', rival:false, n:3, tier:'standard', promo:'giveaway',    promoLabel:'Rangers Garden Flag Giveaway' },
  // August — 13 games
  { start:'2025-08-01', opp:'New York Yankees',    lg:'AL', rival:false, n:4, tier:'featured', promo:'giveaway',    promoLabel:'Marcus Semien Replica Ring Night' },
  { start:'2025-08-11', opp:'Athletics',           lg:'AL', rival:true,  n:3, tier:'standard', promo:'theme_night', promoLabel:'Back-to-School Night' },
  { start:'2025-08-18', opp:'Houston Astros',      lg:'AL', rival:true,  n:3, tier:'featured', promo:'giveaway',    promoLabel:'Nathan Eovaldi Bobblehead' },
  { start:'2025-08-25', opp:'St. Louis Cardinals', lg:'NL', rival:false, n:3, tier:'standard', promo:null,          promoLabel:null },
  // September — 9 games
  { start:'2025-09-05', opp:'Los Angeles Angels',  lg:'AL', rival:true,  n:3, tier:'select',   promo:'theme_night', promoLabel:'Fan Appreciation Weekend' },
  { start:'2025-09-12', opp:'Boston Red Sox',      lg:'AL', rival:false, n:3, tier:'select',   promo:null,          promoLabel:null },
  { start:'2025-09-22', opp:'Houston Astros',      lg:'AL', rival:true,  n:3, tier:'featured', promo:'giveaway',    promoLabel:'Final Homestand Championship Poster' },
];

// Build GAMES array from SERIES_SCHEDULE
function buildGames() {
  const games = [];
  let id = 1;
  // Opening Day is always a day_game regardless of day-of-week
  const openingDate = SERIES_SCHEDULE[0].start;

  for (const s of SERIES_SCHEDULE) {
    const startDate = new Date(s.start + 'T12:00:00');
    for (let g = 0; g < s.n; g++, id++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + g);
      const dateStr = d.toISOString().slice(0, 10);
      const dow = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

      let day_type;
      if (dateStr === openingDate) {
        day_type = 'day_game';
      } else if (dow === 0 || dow === 6 || dow === 5) {
        day_type = 'weekend_friday';
      } else if (g === 0 && dow >= 1 && dow <= 3 && s.tier === 'standard') {
        // First game of some standard weekday series = day game (getaway day)
        day_type = 'day_game';
      } else {
        day_type = 'weeknight';
      }

      // Only first game of series may have a promo (rest are null)
      const promo_type   = g === 0 ? s.promo       : null;
      const promo_label  = g === 0 ? s.promoLabel  : null;

      games.push({
        id:               `G${String(id).padStart(3, '0')}`,
        date:             dateStr,
        opponent:         s.opp,
        opponent_league:  s.lg,
        is_division_rival: s.rival,
        day_type,
        game_tier:        s.tier,
        promo_type,
        promo_label,
        month:            d.getMonth(),
      });
    }
  }
  return games;
}

const GAMES = buildGames();

console.assert(GAMES.length === 81, `GAMES should have 81 home games, got ${GAMES.length}`);
console.log('GAMES OK — ' + GAMES.length + ' home games, ' + new Set(GAMES.map(g => g.opponent)).size + ' opponents');

const GAME_BY_ID = Object.fromEntries(GAMES.map(g => [g.id, g]));

// ── Seasonality ──────────────────────────────────
// index 0–11 = Jan–Dec; season runs March(2)–September(8)
const SEASONALITY = [0, 0, 0, 0.82, 0.88, 0.94, 1.00, 0.97, 0.91, 0, 0, 0];

const TIER_ATTENDANCE = { featured: 39200, select: 33500, standard: 27500 };
const CAPACITY = 40518; // Globe Life Field

// ── GAME_TICKETS ──────────────────────────────────
function generateGameTickets() {
  return GAMES.map(g => {
    const base = TIER_ATTENDANCE[g.game_tier];
    const v    = deterministicVariance(g.id, 1);
    const seasonMult = SEASONALITY[g.month] || 0.85;
    const tickets_sold_total = Math.min(CAPACITY, Math.round(base * seasonMult * v));
    const stm_share   = 0.58 + deterministicVariance(g.id, 2) * 0.06 - 0.03;
    const sec_share   = g.game_tier === 'featured' ? 0.10 + deterministicVariance(g.id, 3) * 0.04
                      : g.game_tier === 'select'   ? 0.07 + deterministicVariance(g.id, 3) * 0.03
                      :                              0.04 + deterministicVariance(g.id, 3) * 0.02;
    const stm_tickets      = Math.round(tickets_sold_total * stm_share);
    const secondary_tickets = Math.round(tickets_sold_total * sec_share);
    const single_tickets    = tickets_sold_total - stm_tickets - secondary_tickets;

    const stm_avg    = 50 + Math.round(deterministicVariance(g.id, 4) * 10 - 5);
    const single_avg = 76 + Math.round(deterministicVariance(g.id, 5) * 20 - 10);
    const sec_adj    = g.game_tier === 'featured' ? 1.12 : g.game_tier === 'standard' ? 0.91 : 1.02;
    const sec_avg    = Math.round(single_avg * sec_adj);

    const gross_revenue     = stm_tickets * stm_avg + single_tickets * single_avg + secondary_tickets * sec_avg;
    const days_adv_base     = g.game_tier === 'featured' ? 28 : g.game_tier === 'select' ? 18 : 10;

    return {
      game_id:              g.id,
      date:                 g.date,
      tickets_sold_total,
      stm_tickets,
      single_tickets,
      secondary_tickets,
      gross_revenue,
      stm_revenue:          stm_tickets * stm_avg,
      single_revenue:       single_tickets * single_avg,
      secondary_revenue:    secondary_tickets * sec_avg,
      avg_ticket_value:     Math.round(gross_revenue / tickets_sold_total),
      stm_avg_value:        stm_avg,
      single_avg_value:     single_avg,
      secondary_avg_value:  sec_avg,
      secondary_market_share: parseFloat(sec_share.toFixed(3)),
      avg_days_in_advance:  days_adv_base + Math.round(deterministicVariance(g.id, 6) * 8 - 4),
      game_tier:            g.game_tier,
      day_type:             g.day_type,
      promo_type:           g.promo_type,
    };
  });
}

const GAME_TICKETS = generateGameTickets();
console.assert(GAME_TICKETS.length === 81, 'GAME_TICKETS row count');

// ── GAME_SCANS ──────────────────────────────────
function generateGameScans() {
  return GAMES.map((g, i) => {
    const tkt = GAME_TICKETS[i];
    const noShowBase = g.game_tier === 'featured' ? 0.026 : g.game_tier === 'select' ? 0.038 : 0.055;
    const no_show_rate = noShowBase + deterministicVariance(g.id, 10) * 0.014 - 0.007;
    const tickets_scanned = Math.round(tkt.tickets_sold_total * (1 - no_show_rate));
    const no_show_count   = tkt.tickets_sold_total - tickets_scanned;

    // Arrival distribution sums to 1.0
    const a90p = 0.09  + deterministicVariance(g.id, 11) * 0.04 - 0.02;
    const a60  = 0.17  + deterministicVariance(g.id, 12) * 0.04 - 0.02;
    const a30  = 0.30  + deterministicVariance(g.id, 13) * 0.04 - 0.02;
    const a0   = 0.28  + deterministicVariance(g.id, 14) * 0.04 - 0.02;
    const aPost = Math.max(0.03, parseFloat((1 - a90p - a60 - a30 - a0).toFixed(3)));

    return {
      game_id:            g.id,
      date:               g.date,
      tickets_scanned,
      no_show_count,
      no_show_rate:       parseFloat(no_show_rate.toFixed(3)),
      stm_no_show_rate:   parseFloat((0.015 + deterministicVariance(g.id, 15) * 0.008).toFixed(3)),
      single_no_show_rate: parseFloat((0.065 + deterministicVariance(g.id, 16) * 0.020).toFixed(3)),
      secondary_no_show_rate: parseFloat((0.130 + deterministicVariance(g.id, 17) * 0.030).toFixed(3)),
      arr_90plus:         parseFloat(a90p.toFixed(3)),
      arr_60to90:         parseFloat(a60.toFixed(3)),
      arr_30to60:         parseFloat(a30.toFixed(3)),
      arr_0to30:          parseFloat(a0.toFixed(3)),
      arr_post_pitch:     aPost,
      avg_tickets_per_scan: parseFloat((2.1 + deterministicVariance(g.id, 18) * 0.6 - 0.3).toFixed(2)),
      solo_scan_pct:      parseFloat((0.27 + deterministicVariance(g.id, 19) * 0.06 - 0.03).toFixed(3)),
      group_2to3_pct:     parseFloat((0.42 + deterministicVariance(g.id, 20) * 0.06 - 0.03).toFixed(3)),
      group_4plus_pct:    parseFloat((0.28 + deterministicVariance(g.id, 21) * 0.04 - 0.02).toFixed(3)),
      game_tier:          g.game_tier,
      day_type:           g.day_type,
      promo_type:         g.promo_type,
    };
  });
}

const GAME_SCANS = generateGameScans();
console.assert(GAME_SCANS.length === 81, 'GAME_SCANS row count');

// ── GAME_FNB ──────────────────────────────────
const FNB_DAY_TYPE_MULT = { weekend_friday: 1.15, weeknight: 1.00, day_game: 0.88 };
const FNB_TIER_BASE_PERCAP = { featured: 25.50, select: 22.80, standard: 19.40 };

function generateGameFnB() {
  return GAMES.map((g, i) => {
    const scan = GAME_SCANS[i];
    const dayMult  = FNB_DAY_TYPE_MULT[g.day_type] || 1.0;
    const percap   = FNB_TIER_BASE_PERCAP[g.game_tier] * dayMult * deterministicVariance(g.id, 30);
    const attach   = 0.58 + deterministicVariance(g.id, 31) * 0.10 - 0.05;
    const unique_visitors_with_fnb = Math.round(scan.tickets_scanned * attach);
    const total_revenue = Math.round(scan.tickets_scanned * percap);
    return {
      game_id:              g.id,
      date:                 g.date,
      total_revenue,
      food_revenue:         Math.round(total_revenue * 0.44),
      beer_wine_revenue:    Math.round(total_revenue * (0.38 + (g.month >= 5 && g.month <= 7 ? 0.03 : 0))),
      non_alc_revenue:      Math.round(total_revenue * 0.18),
      transaction_count:    Math.round(unique_visitors_with_fnb * 1.85),
      unique_visitors_with_fnb,
      avg_per_cap:          parseFloat(percap.toFixed(2)),
      fnb_attach_rate:      parseFloat(attach.toFixed(3)),
      game_tier:            g.game_tier,
      day_type:             g.day_type,
      promo_type:           g.promo_type,
    };
  });
}

const GAME_FNB = generateGameFnB();
console.assert(GAME_FNB.length === 81, 'GAME_FNB row count');

const totalFnBRev = GAME_FNB.reduce((s, r) => s + r.total_revenue, 0);
console.log('GAME DATA OK — FnB season total $' + (totalFnBRev / 1e6).toFixed(1) + 'M');

// ── Fan Records — 500 fans across 3 source systems ──────────────
// Ticketmaster (TICKET) · MLB Ballpark App / Gate Scan (SCAN) · Delaware North F&B (FNB)

const US_STATES    = ['TX','OK','LA','CO','NM','CA','NY','FL','GA','IL','TN','AR','MO','KS','AZ'];
const STATE_WEIGHTS= [260,  22,  14,  10,   8,   7,   5,   5,   4,   4,   3,   3,   3,   3,   3];
const SEAT_SECTIONS= ['Lexus Club','Balcones Speakeasy','Field Level','Main Level','Upper Level','Outfield'];
const SEAT_WEIGHTS = [   20,              15,               80,           120,          100,         65];
const FNB_CATS     = ['food','beer_wine','non_alc'];
const TICKET_TYPES = ['lone_star','single_game','secondary'];
const TKT_WEIGHTS  = [55, 30, 15];

// 7 segments — total 500, linked = 160+95+65+42 = 362
const SEGMENTS = [
  { count:160, sources:['TICKET','SCAN','FNB'], linked:true  },
  { count: 95, sources:['TICKET','SCAN'],       linked:true  },
  { count: 65, sources:['TICKET','FNB'],        linked:true  },
  { count: 42, sources:['SCAN','FNB'],          linked:true  },  // Dark fans — P3RL punchline
  { count: 68, sources:['TICKET'],              linked:false },
  { count: 40, sources:['SCAN'],                linked:false },
  { count: 30, sources:['FNB'],                 linked:false },
];

function generateFans() {
  const fans = [];
  let idx = 0;
  for (const seg of SEGMENTS) {
    for (let i = 0; i < seg.count; i++, idx++) {
      const seed  = idx * 7919 + 42;
      const state = weightedPick(US_STATES, STATE_WEIGHTS, seed);
      const hasTkt  = seg.sources.includes('TICKET');
      const hasScan = seg.sources.includes('SCAN');
      const hasFnb  = seg.sources.includes('FNB');

      const ticket_type    = hasTkt ? weightedPick(TICKET_TYPES, TKT_WEIGHTS, seed + 1) : null;
      const seat_section   = hasTkt ? weightedPick(SEAT_SECTIONS, SEAT_WEIGHTS, seed + 2) : null;
      const games_purchased = hasTkt
        ? (ticket_type === 'lone_star' ? 81 : 1 + (seed % 12))
        : null;
      const ticket_spend   = hasTkt
        ? (ticket_type === 'lone_star'
            ? 2500 + (seed % 2500)
            : games_purchased * (55 + (seed % 80)))
        : null;
      const games_attended = hasScan
        ? (hasTkt && ticket_type === 'lone_star'
            ? Math.round(games_purchased * (0.78 + deterministicVariance(idx, 40) * 0.18))
            : 1 + (seed % (games_purchased || 10)))
        : null;
      const stm_utilization = (hasScan && hasTkt && ticket_type === 'lone_star' && games_purchased)
        ? parseFloat((games_attended / games_purchased).toFixed(3))
        : null;
      const arr_buckets = ['90plus','60to90','30to60','0to30','post_pitch'];
      const avg_arrival_bucket = arr_buckets[seed % 5];
      const avg_group_size = hasScan ? parseFloat((1.5 + deterministicVariance(idx, 41) * 2.0).toFixed(1)) : null;

      const fnb_visit_count = hasFnb
        ? (hasScan ? Math.min(games_attended || 10, 3 + (seed % 12)) : 2 + (seed % 10))
        : null;
      const fnb_spend      = hasFnb ? Math.round(fnb_visit_count * (15 + (seed % 28))) : null;
      const fnb_top_cat    = hasFnb ? FNB_CATS[seed % 3] : null;

      const total_cross_channel_spend = (ticket_spend || 0) + (fnb_spend || 0);

      fans.push({
        ticketing_fan_id:  hasTkt  ? `TKT-${String(idx+1).padStart(6,'0')}` : null,
        scan_fan_id:       hasScan ? `SCN-${String(idx+1).padStart(6,'0')}` : null,
        fnb_fan_id:        hasFnb  ? `FNB-${String(idx+1).padStart(6,'0')}` : null,
        global_fan_id:     seg.linked ? `GF-${String(idx+1).padStart(6,'0')}` : null,
        linked_sources:         seg.sources.join('|'),
        match_confidence_score: seg.linked ? parseFloat((0.82 + deterministicVariance(idx, 45) * 0.16).toFixed(2)) : null,
        ticket_type,
        ticket_spend,
        games_purchased,
        seat_section,
        ticket_state:      hasTkt  ? state : null,
        games_attended,
        stm_utilization,
        avg_arrival_bucket,
        avg_group_size,
        scan_state:        hasScan ? state : null,
        fnb_spend,
        fnb_transactions:  hasFnb ? Math.round((fnb_visit_count || 1) * (1 + (seed % 3))) : null,
        fnb_avg_transaction: hasFnb ? Math.round((fnb_spend || 0) / Math.max(1, (fnb_visit_count || 1) * (1 + (seed % 3)))) : null,
        fnb_top_category:  fnb_top_cat,
        fnb_attach_flag:   hasFnb,
        fnb_visit_count,
        total_cross_channel_spend,
        home_state:        state,
      });
    }
  }
  return fans;
}

const FANS = generateFans();

console.assert(FANS.length === 500, 'FANS should have 500 records');
console.assert(FANS.filter(f => f.global_fan_id).length === 362, `Linked fans: expected 362, got ${FANS.filter(f=>f.global_fan_id).length}`);
const darkFans = FANS.filter(f => f.linked_sources === 'SCAN|FNB');
console.assert(darkFans.length === 42, `Dark fans (SCAN+FNB only): expected 42, got ${darkFans.length}`);
console.log(`FANS OK — 500 total, ${FANS.filter(f=>f.global_fan_id).length} linked, ${darkFans.length} dark fans`);

function getTop10PctThreshold() {
  const linked = FANS.filter(f => f.global_fan_id);
  const sorted = [...linked].sort((a, b) => b.total_cross_channel_spend - a.total_cross_channel_spend);
  return sorted[Math.floor(sorted.length * 0.10)]?.total_cross_channel_spend ?? 0;
}
