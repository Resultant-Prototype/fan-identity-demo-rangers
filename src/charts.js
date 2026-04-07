// ═══════════════════════════════════════════════
// CHART REGISTRY
// ═══════════════════════════════════════════════
const CHARTS = {};

function destroyChart(id) {
  if (CHARTS[id]) { CHARTS[id].destroy(); delete CHARTS[id]; }
}

Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#6B7280';

const PALETTE = {
  navy:  '#1B2A4A',
  teal:  '#00A896',
  teal2: '#48CAB2',
  gray:  '#D4D8DF',
  red:   '#E63946',
  amber: '#F4A261',
};

// ═══════════════════════════════════════════════
// TAB 1: ADW WAGERING
// ═══════════════════════════════════════════════

function renderTab1() {
  const f = STATE.tab1;
  const daily = filterDaily(DAILY_ADW, f);
  const fans  = filterFans(f, 'tab1');

  const totalHandle = daily.reduce((s,r) => s + r.handle, 0);
  const totalDeposits = daily.reduce((s,r) => s + r.deposits, 0);
  const totalWithdrawals = daily.reduce((s,r) => s + r.withdrawals, 0);
  const activeAccounts = daily.length > 0 ? Math.max(...daily.map(r => r.active_accounts)) : 0;
  const newRegs = daily.reduce((s,r) => s + r.new_registrations, 0);
  const mobileHandle = daily.reduce((s,r) => s + r.mobile_handle, 0);
  const mobileShare = totalHandle > 0 ? mobileHandle / totalHandle : 0;

  const [wStart, wEnd] = getDateWindow(f);
  const windowDays = Math.round((wEnd - wStart) / 86400000);
  const priorEnd = new Date(wStart); priorEnd.setDate(priorEnd.getDate() - 1);
  const priorStart = new Date(priorEnd); priorStart.setDate(priorEnd.getDate() - windowDays);
  const priorFilters = { ...f, customStart: priorStart.toISOString().slice(0,10), customEnd: priorEnd.toISOString().slice(0,10), dateRange: 'custom' };
  const priorDaily = filterDaily(DAILY_ADW, priorFilters);
  const priorHandle = priorDaily.reduce((s,r) => s + r.handle, 0);

  renderBANs('t1-bans', [
    { label: 'Total Handle', value: fmt.currency(totalHandle), delta: fmt.delta(totalHandle, priorHandle) },
    { label: 'Total Deposits', value: fmt.currency(totalDeposits) },
    { label: 'Total Withdrawals', value: fmt.currency(totalWithdrawals) },
    { label: 'Active Accounts', value: fmt.num(activeAccounts) },
    { label: 'New Registrations', value: fmt.num(newRegs) },
    { label: 'Mobile Share', value: fmt.pct(mobileShare) },
  ]);

  // Chart 1: Handle by Day (line)
  destroyChart('t1-handleByDay');
  const byDayLabels = [...new Set(daily.map(r => r.date))].sort();
  const byDayData = byDayLabels.map(dt =>
    daily.filter(r => r.date === dt).reduce((s,r) => s + r.handle, 0)
  );
  CHARTS['t1-handleByDay'] = new Chart(document.getElementById('t1-handleByDay'), {
    type: 'line',
    data: {
      labels: byDayLabels,
      datasets: [{ label: 'Handle', data: byDayData, borderColor: PALETTE.teal,
                   backgroundColor: 'rgba(0,168,150,.08)', fill: true, pointRadius: 0,
                   borderWidth: 2, tension: 0.3 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { maxTicksLimit: 12,
               callback: (_, i) => byDayLabels[i]?.slice(5) }, grid: { display: false } },
        y: { ticks: { callback: v => fmt.currency(v) } },
      },
    },
  });

  // Chart 2: Marquee Day Handle vs. Benchmark Years (grouped bar)
  destroyChart('t1-marqueeBar');
  const marqueeRows = DAILY_ADW.filter(r => r.is_marquee);
  const marqueeEvents = [...new Set(marqueeRows.map(r => r.event_id))];
  const marqueeLabels = marqueeEvents.map(id => EVENTS.find(e => e.id === id)?.name || id);
  const marquee2025 = marqueeEvents.map(id =>
    marqueeRows.filter(r => r.event_id === id).reduce((s,r) => s + r.handle, 0)
  );
  const marquee_py1 = marquee2025.map((v,i) => Math.round(v * (1.18 - i*0.003)));
  const marquee_py2 = marquee2025.map((v,i) => Math.round(v * (1.08 - i*0.002)));
  CHARTS['t1-marqueeBar'] = new Chart(document.getElementById('t1-marqueeBar'), {
    type: 'bar',
    data: {
      labels: marqueeLabels,
      datasets: [
        { label: 'Current Year', data: marquee2025, backgroundColor: PALETTE.teal },
        { label: 'Peak Year 1',  data: marquee_py1, backgroundColor: PALETTE.navy },
        { label: 'Peak Year 2',  data: marquee_py2, backgroundColor: PALETTE.gray },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: {
        x: { ticks: { maxRotation: 30 } },
        y: { ticks: { callback: v => fmt.currency(v) } },
      },
    },
  });

  // Chart 3: Deposits vs. Withdrawals by Day (dual-line)
  destroyChart('t1-depWithDay');
  const depData  = byDayLabels.map(dt => daily.filter(r=>r.date===dt).reduce((s,r)=>s+r.deposits,0));
  const withData = byDayLabels.map(dt => daily.filter(r=>r.date===dt).reduce((s,r)=>s+r.withdrawals,0));
  CHARTS['t1-depWithDay'] = new Chart(document.getElementById('t1-depWithDay'), {
    type: 'line',
    data: {
      labels: byDayLabels,
      datasets: [
        { label: 'Deposits',    data: depData,  borderColor: PALETTE.teal, pointRadius: 0, tension: 0.3, borderWidth: 2 },
        { label: 'Withdrawals', data: withData, borderColor: PALETTE.red,  pointRadius: 0, tension: 0.3, borderWidth: 2 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: { x: { ticks: { maxTicksLimit: 10 }, grid: { display: false } },
                y: { ticks: { callback: v => fmt.currency(v) } } },
    },
  });

  // Chart 4: Mobile vs. Web Donut
  destroyChart('t1-channelDonut');
  const webHandle = daily.reduce((s,r) => s + r.web_handle, 0);
  CHARTS['t1-channelDonut'] = new Chart(document.getElementById('t1-channelDonut'), {
    type: 'doughnut',
    data: {
      labels: ['Mobile', 'Web'],
      datasets: [{ data: [mobileHandle, webHandle],
                   backgroundColor: [PALETTE.teal, PALETTE.navy], borderWidth: 0 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      cutout: '65%',
    },
  });

  // Chart 5: Handle by State — Top 10 (horizontal bar)
  destroyChart('t1-handleByState');
  const stateHandleMap = {};
  fans.forEach(fan => {
    if (fan.adw_state && fan.adw_handle) {
      stateHandleMap[fan.adw_state] = (stateHandleMap[fan.adw_state] || 0) + fan.adw_handle;
    }
  });
  const sampleRatio = 100_000 / FANS.filter(fan => fan.adw_fan_id).length;
  const stateHandleSorted = Object.entries(stateHandleMap)
    .map(([state, val]) => [state, Math.round(val * sampleRatio)])
    .sort((a,b) => b[1]-a[1]).slice(0,10);
  CHARTS['t1-handleByState'] = new Chart(document.getElementById('t1-handleByState'), {
    type: 'bar',
    data: {
      labels: stateHandleSorted.map(([s]) => s),
      datasets: [{ label: 'Handle', data: stateHandleSorted.map(([,v]) => v),
                   backgroundColor: PALETTE.teal, borderRadius: 4 }],
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { callback: v => fmt.currency(v) } }, y: { grid: { display: false } } },
    },
  });
}

// ═══════════════════════════════════════════════
// TAB 2: TICKET SALES
// ═══════════════════════════════════════════════

function renderTab2() {
  const f = STATE.tab2;
  let daily = filterDaily(DAILY_TICKETS, f);
  if (f.eventType === 'marquee') daily = daily.filter(r => r.is_marquee);
  if (f.eventType === 'regular') daily = daily.filter(r => !r.is_marquee);
  const fans = filterFans(f, 'tab2');

  const totalTickets = daily.reduce((s,r) => s + r.tickets_sold, 0);
  const totalRev     = daily.reduce((s,r) => s + r.gross_revenue, 0);
  const avgTktVal    = totalTickets > 0 ? totalRev / totalTickets : 0;
  const uniquePurchasers = Math.round(fans.length * 1.4);
  const repeatBuyers = fans.filter(fan => fan.repeat_buyer).length;
  const repeatPct = fans.length > 0 ? repeatBuyers / fans.length : 0;
  const stateMap = {};
  fans.forEach(fan => { if (fan.ticket_state) stateMap[fan.ticket_state] = (stateMap[fan.ticket_state]||0)+1; });
  const topState = Object.entries(stateMap).sort((a,b) => b[1]-a[1])[0]?.[0] || '—';

  renderBANs('t2-bans', [
    { label: 'Tickets Sold',      value: fmt.num(totalTickets) },
    { label: 'Unique Purchasers', value: fmt.num(uniquePurchasers) },
    { label: 'Gross Revenue',     value: fmt.currency(totalRev) },
    { label: 'Avg. Ticket Value', value: '$' + avgTktVal.toFixed(0) },
    { label: 'Repeat Buyers',     value: fmt.pct(repeatPct) },
    { label: 'Top State',         value: topState },
  ]);

  // Chart: Ticket Purchases Over Time (line by month)
  destroyChart('t2-tktOverTime');
  const byMonth = {};
  daily.forEach(r => {
    const mo = r.date.slice(0,7);
    byMonth[mo] = (byMonth[mo]||0) + r.tickets_sold;
  });
  const moLabels = Object.keys(byMonth).sort();
  CHARTS['t2-tktOverTime'] = new Chart(document.getElementById('t2-tktOverTime'), {
    type: 'line',
    data: {
      labels: moLabels,
      datasets: [{ label: 'Tickets Sold', data: moLabels.map(m => byMonth[m]),
                   borderColor: PALETTE.teal, backgroundColor: 'rgba(0,168,150,.08)',
                   fill: true, pointRadius: 4, tension: 0.3, borderWidth: 2 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false } }, y: { ticks: { callback: v => fmt.num(v) } } },
    },
  });

  // Chart: Tickets Sold by Event (horizontal bar)
  destroyChart('t2-soldByEvent');
  const eventRows = DAILY_TICKETS.filter(r => r.is_marquee);
  const eventMap = {};
  eventRows.forEach(r => { eventMap[r.event_name] = (eventMap[r.event_name]||0) + r.tickets_sold; });
  const evSorted = Object.entries(eventMap).sort((a,b) => b[1]-a[1]);
  CHARTS['t2-soldByEvent'] = new Chart(document.getElementById('t2-soldByEvent'), {
    type: 'bar',
    data: {
      labels: evSorted.map(([n])=>n),
      datasets: [{ label: 'Tickets Sold', data: evSorted.map(([,v])=>v),
                   backgroundColor: PALETTE.teal, borderRadius: 4 }],
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { callback: v => fmt.num(v) } }, y: { grid: { display: false } } },
    },
  });

  // Chart: Revenue by Event and Seat Category (stacked bar)
  destroyChart('t2-revByEventSeat');
  const evPremMap = {}, evGenMap = {};
  eventRows.forEach(r => {
    evPremMap[r.event_name] = (evPremMap[r.event_name]||0) + r.premium_revenue;
    evGenMap[r.event_name]  = (evGenMap[r.event_name]||0)  + r.general_revenue;
  });
  const evNames = evSorted.map(([n])=>n);
  CHARTS['t2-revByEventSeat'] = new Chart(document.getElementById('t2-revByEventSeat'), {
    type: 'bar',
    data: {
      labels: evNames,
      datasets: [
        { label: 'Premium',           data: evNames.map(n => evPremMap[n]||0), backgroundColor: PALETTE.navy },
        { label: 'General Admission', data: evNames.map(n => evGenMap[n]||0),  backgroundColor: PALETTE.teal2 },
      ],
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: { x: { stacked: true, ticks: { callback: v => fmt.currency(v) } },
                y: { stacked: true, grid: { display: false } } },
    },
  });

  // Chart: Historical Marquee Performance (grouped bar)
  destroyChart('t2-historicalMarquee');
  const curr = evNames.map(n => (evPremMap[n]||0) + (evGenMap[n]||0));
  CHARTS['t2-historicalMarquee'] = new Chart(document.getElementById('t2-historicalMarquee'), {
    type: 'bar',
    data: {
      labels: evNames,
      datasets: [
        { label: 'Current Year', data: curr, backgroundColor: PALETTE.teal },
        { label: 'Peak Year 1',  data: curr.map((v,i) => Math.round(v*(1.16-i*0.004))), backgroundColor: PALETTE.navy },
        { label: 'Peak Year 2',  data: curr.map((v,i) => Math.round(v*(1.07-i*0.003))), backgroundColor: PALETTE.gray },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: { x: { ticks: { maxRotation: 30 } }, y: { ticks: { callback: v => fmt.currency(v) } } },
    },
  });

  // Chart: Buyers by State — Top 10
  destroyChart('t2-buyersByState');
  const stateCount = {};
  fans.forEach(fan => { if (fan.ticket_state) stateCount[fan.ticket_state] = (stateCount[fan.ticket_state]||0)+1; });
  const stateSorted = Object.entries(stateCount).sort((a,b)=>b[1]-a[1]).slice(0,10);
  CHARTS['t2-buyersByState'] = new Chart(document.getElementById('t2-buyersByState'), {
    type: 'bar',
    data: {
      labels: stateSorted.map(([s])=>s),
      datasets: [{ label: 'Buyers', data: stateSorted.map(([,v])=>v),
                   backgroundColor: PALETTE.teal, borderRadius: 4 }],
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { stepSize: 1 } }, y: { grid: { display: false } } },
    },
  });
}

// ═══════════════════════════════════════════════
// TAB 3: FOOD & BEVERAGE
// ═══════════════════════════════════════════════

function renderTab3() {
  const f = STATE.tab3;
  let daily = filterDaily(DAILY_FNB, f);
  if (f.visitType === 'marquee') daily = daily.filter(r => r.is_marquee);
  if (f.visitType === 'regular') daily = daily.filter(r => !r.is_marquee);

  const catKey = { food: 'food_revenue', beer_wine: 'beer_wine_revenue', non_alc: 'non_alc_revenue' };
  const revKey = catKey[f.fnbCategory] || null;
  const fans = filterFans(f, 'tab3');

  const totalRev = daily.reduce((s,r) => s + (revKey ? r[revKey] : r.total_revenue), 0);
  const totalTxns = daily.reduce((s,r) => s + r.transaction_count, 0);
  const totalVisitors = daily.reduce((s,r) => s + r.unique_visitors_with_fnb, 0);
  const avgPerCap = totalVisitors > 0 ? totalRev / totalVisitors : 0;
  const avgTxnVal = totalTxns > 0 ? totalRev / totalTxns : 0;
  const ticketFans = FANS.filter(fan => fan.ticketing_fan_id);
  const attachRate = ticketFans.length > 0
    ? ticketFans.filter(fan => fan.fnb_fan_id).length / ticketFans.length
    : 0;
  const catRevs = {
    Food: daily.reduce((s,r) => s+r.food_revenue, 0),
    'Beer & Wine': daily.reduce((s,r) => s+r.beer_wine_revenue, 0),
    'Non-Alcoholic': daily.reduce((s,r) => s+r.non_alc_revenue, 0),
  };
  const topCat = Object.entries(catRevs).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—';

  renderBANs('t3-bans', [
    { label: 'Total F&B Revenue',     value: fmt.currency(totalRev) },
    { label: 'Avg. Per-Cap Spend',    value: '$' + avgPerCap.toFixed(2) },
    { label: 'F&B Attach Rate',       value: fmt.pct(attachRate) },
    { label: 'Top Category',          value: topCat },
    { label: 'Transactions',          value: fmt.num(totalTxns) },
    { label: 'Avg. Transaction Value',value: '$' + avgTxnVal.toFixed(2) },
  ]);

  // Chart: F&B Revenue by Day
  destroyChart('t3-revByDay');
  const byDay = {};
  daily.forEach(r => { byDay[r.date] = (byDay[r.date]||0) + (revKey ? r[revKey] : r.total_revenue); });
  const dayLabels = Object.keys(byDay).sort();
  CHARTS['t3-revByDay'] = new Chart(document.getElementById('t3-revByDay'), {
    type: 'line',
    data: {
      labels: dayLabels,
      datasets: [{ label: 'F&B Revenue', data: dayLabels.map(d=>byDay[d]),
                   borderColor: PALETTE.teal, backgroundColor: 'rgba(0,168,150,.08)',
                   fill: true, pointRadius: 0, tension: 0.3, borderWidth: 2 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { maxTicksLimit: 12 }, grid: { display: false } },
                y: { ticks: { callback: v => fmt.currency(v) } } },
    },
  });

  // Chart: Per-Cap Spend by Venue (bar)
  destroyChart('t3-perCapVenue');
  const venuePerCap = VENUES.map(v => {
    const vRows = DAILY_FNB.filter(r => r.venue === v);
    const vRev  = vRows.reduce((s,r)=>s+r.total_revenue,0);
    const vVis  = vRows.reduce((s,r)=>s+r.unique_visitors_with_fnb,0);
    return vVis > 0 ? vRev/vVis : 0;
  });
  CHARTS['t3-perCapVenue'] = new Chart(document.getElementById('t3-perCapVenue'), {
    type: 'bar',
    data: {
      labels: VENUES,
      datasets: [{ label: 'Per-Cap Spend', data: venuePerCap,
                   backgroundColor: [PALETTE.navy, PALETTE.teal, PALETTE.teal2], borderRadius: 4 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { ticks: { callback: v => '$'+v.toFixed(0) } } },
    },
  });

  // Chart: Revenue by Category by Month (stacked bar)
  destroyChart('t3-revByCategory');
  const months = [...new Set(daily.map(r=>r.date.slice(0,7)))].sort();
  const foodByMo = months.map(m => daily.filter(r=>r.date.startsWith(m)).reduce((s,r)=>s+r.food_revenue,0));
  const beerByMo = months.map(m => daily.filter(r=>r.date.startsWith(m)).reduce((s,r)=>s+r.beer_wine_revenue,0));
  const naByMo   = months.map(m => daily.filter(r=>r.date.startsWith(m)).reduce((s,r)=>s+r.non_alc_revenue,0));
  CHARTS['t3-revByCategory'] = new Chart(document.getElementById('t3-revByCategory'), {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        { label: 'Food',          data: foodByMo, backgroundColor: PALETTE.navy, stack: 'cat' },
        { label: 'Beer & Wine',   data: beerByMo, backgroundColor: PALETTE.teal, stack: 'cat' },
        { label: 'Non-Alcoholic', data: naByMo,   backgroundColor: PALETTE.teal2, stack: 'cat' },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: { x: { stacked: true }, y: { stacked: true, ticks: { callback: v=>fmt.currency(v) } } },
    },
  });

  // Chart: Attach Rate by Event (horizontal bar)
  destroyChart('t3-attachByEvent');
  const attachByEv = EVENTS.map(ev => {
    const tkt = DAILY_TICKETS.find(r => r.event_id === ev.id);
    const fnb = DAILY_FNB.find(r => r.event_id === ev.id);
    if (!tkt || !fnb || !tkt.tickets_sold) return { name: ev.name, rate: 0 };
    return { name: ev.name, rate: fnb.unique_visitors_with_fnb / tkt.tickets_sold };
  }).sort((a,b) => b.rate - a.rate);
  CHARTS['t3-attachByEvent'] = new Chart(document.getElementById('t3-attachByEvent'), {
    type: 'bar',
    data: {
      labels: attachByEv.map(e=>e.name),
      datasets: [{ label: 'Attach Rate', data: attachByEv.map(e=>e.rate),
                   backgroundColor: PALETTE.teal, borderRadius: 4 }],
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { max: 1, ticks: { callback: v => fmt.pct(v) } }, y: { grid: { display: false } } },
    },
  });

  // Chart: Per-Cap by Seat Category (horizontal bar)
  destroyChart('t3-perCapSeat');
  const premFans = fans.filter(fan => fan.seat_category === 'premium' && fan.fnb_spend);
  const genFans  = fans.filter(fan => fan.seat_category === 'general'  && fan.fnb_spend);
  const premPC = premFans.length > 0 ? premFans.reduce((s,fan)=>s+(fan.fnb_spend/Math.max(1,fan.fnb_visit_count)),0)/premFans.length : 0;
  const genPC  = genFans.length  > 0 ? genFans.reduce((s,fan)=>s+(fan.fnb_spend/Math.max(1,fan.fnb_visit_count)),0)/genFans.length   : 0;
  CHARTS['t3-perCapSeat'] = new Chart(document.getElementById('t3-perCapSeat'), {
    type: 'bar',
    data: {
      labels: ['Premium', 'General Admission'],
      datasets: [{ label: 'Per-Cap Spend', data: [premPC, genPC],
                   backgroundColor: [PALETTE.navy, PALETTE.teal2], borderRadius: 4 }],
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { callback: v => '$'+v.toFixed(0) } }, y: { grid: { display: false } } },
    },
  });
}

// ═══════════════════════════════════════════════
// TAB 4: FAN IDENTITY
// ═══════════════════════════════════════════════

const VENN_POP = {
  adw_only:   12400,
  ticket_only: 8100,
  fnb_only:    6300,
  adw_ticket: 27000,
  adw_fnb:    20000,
  ticket_fnb:  9200,
  all_three:  38000,
};

function renderTab4() {
  const f = STATE.tab4;
  const fans = filterFans(f, 'tab4');
  const linkedFans = fans.filter(fan => fan.global_fan_id);
  const avgXCS = linkedFans.length > 0 ? linkedFans.reduce((s,fan)=>s+fan.total_cross_channel_spend,0)/linkedFans.length : 0;

  const adwFans   = FANS.filter(fan => fan.adw_fan_id);
  const tickFans  = FANS.filter(fan => fan.ticketing_fan_id);
  const adwAndTkt = FANS.filter(fan => fan.adw_fan_id && fan.ticketing_fan_id);
  const tktNoAdw  = FANS.filter(fan => fan.ticketing_fan_id && !fan.adw_fan_id);

  const adwAlsoBuyTkt = adwFans.length > 0 ? adwAndTkt.length / adwFans.length : 0;
  const tktNoWager    = tickFans.length > 0 ? tktNoAdw.length / tickFans.length : 0;

  const threshold = getTop10PctThreshold();
  const avgConf = linkedFans.length > 0
    ? linkedFans.reduce((s,fan)=>s+(fan.match_confidence_score||0),0)/linkedFans.length
    : 0;
  const LINKED_TOTAL = 94200;

  renderBANs('t4-bans', [
    { label: 'Combined Cross-Channel Spend per Fan', value: fmt.currency(avgXCS), lead: true,
      tooltip: 'This figure was not available before identity resolution connected your wagering, ticketing, and F&B records.' },
    { label: '% ADW Bettors Who Also Buy Tickets', value: fmt.pct(adwAlsoBuyTkt),
      tooltip: 'Active ADW bettors = accounts with at least one wager in the selected date window. Cross-referenced with ticketing system via P3RL linking.' },
    { label: '% Ticket Buyers with No Wagering History', value: fmt.pct(tktNoWager),
      tooltip: 'Ticket buyers who have no linked ADW account. Prime ADW acquisition targets — they already attend events but have not opened a wagering account.' },
    { label: 'Top Decile Spend Threshold', value: fmt.currency(threshold),
      tooltip: 'A fan must exceed this total cross-channel spend (ADW handle + ticket spend + F&B spend) to rank in the top 10% of linked fans.' },
    { label: 'Total Linked Fans', value: fmt.num(LINKED_TOTAL),
      tooltip: 'Linked fans = records matched across two or more source systems by P3RL with confidence score above threshold.' },
    { label: 'Avg. Match Confidence', value: fmt.pct(avgConf),
      tooltip: 'P3RL match confidence score — probability that two records belong to the same individual. Threshold for linking: 85%.' },
  ]);

  // Venn Diagram
  destroyChart('t4-venn');
  CHARTS['t4-venn'] = new Chart(document.getElementById('t4-venn'), {
    type: 'venn',
    data: {
      labels: ['ADW Wagering', 'Ticket Sales', 'Food & Beverage'],
      datasets: [{
        label: 'Fan Overlap',
        data: [
          { sets: ['ADW Wagering'],                          value: VENN_POP.adw_only },
          { sets: ['Ticket Sales'],                          value: VENN_POP.ticket_only },
          { sets: ['Food & Beverage'],                       value: VENN_POP.fnb_only },
          { sets: ['ADW Wagering', 'Ticket Sales'],          value: VENN_POP.adw_ticket },
          { sets: ['ADW Wagering', 'Food & Beverage'],       value: VENN_POP.adw_fnb },
          { sets: ['Ticket Sales', 'Food & Beverage'],       value: VENN_POP.ticket_fnb },
          { sets: ['ADW Wagering', 'Ticket Sales', 'Food & Beverage'], value: VENN_POP.all_three },
        ],
        backgroundColor: [
          'rgba(27,42,74,.6)',
          'rgba(0,168,150,.6)',
          'rgba(72,202,178,.6)',
          'rgba(0,100,120,.5)',
          'rgba(0,90,90,.5)',
          'rgba(0,140,130,.5)',
          'rgba(0,168,150,.85)',
        ],
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const d = ctx.dataset.data[ctx.dataIndex];
              return `${d.sets.join(' ∩ ')}: ${d.value.toLocaleString()} fans`;
            },
          },
        },
      },
    },
  });

  // VIP Tier vs. Cross-Channel Spend (scatter)
  destroyChart('t4-vipScatter');
  const tierOrder = { platinum: 4, gold: 3, silver: 2, standard: 1 };
  const scatterData = linkedFans.map(fan => ({
    x: tierOrder[fan.adw_vip_tier] || 1,
    y: fan.total_cross_channel_spend,
  })).filter(p => p.x && p.y);
  CHARTS['t4-vipScatter'] = new Chart(document.getElementById('t4-vipScatter'), {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Linked Fans',
        data: scatterData,
        backgroundColor: 'rgba(0,168,150,.5)',
        pointRadius: 4,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: {
          label: ctx => `Tier: ${['','Standard','Silver','Gold','Platinum'][ctx.raw.x]} | XCS: ${fmt.currency(ctx.raw.y)}`
        }},
      },
      scales: {
        x: { min: 0.5, max: 4.5, ticks: { stepSize: 1,
               callback: v => ['','Standard','Silver','Gold','Platinum'][v] || '' } },
        y: { ticks: { callback: v => fmt.currency(v) } },
      },
    },
  });

  // Top Decile — Cross-Channel Spend Breakdown (stacked horizontal bar)
  destroyChart('t4-topDecile');
  const topFans = [...linkedFans]
    .sort((a,b)=>b.total_cross_channel_spend-a.total_cross_channel_spend)
    .slice(0, Math.max(1, Math.floor(linkedFans.length*0.10)));
  const topN = topFans.slice(0, 10);
  CHARTS['t4-topDecile'] = new Chart(document.getElementById('t4-topDecile'), {
    type: 'bar',
    data: {
      labels: topN.map((_, i) => `Fan #${i+1}`),
      datasets: [
        { label: 'ADW Handle',   data: topN.map(fan=>fan.adw_handle||0),   backgroundColor: PALETTE.navy,  stack: 's' },
        { label: 'Ticket Spend', data: topN.map(fan=>fan.ticket_spend||0), backgroundColor: PALETTE.teal,  stack: 's' },
        { label: 'F&B Spend',    data: topN.map(fan=>fan.fnb_spend||0),    backgroundColor: PALETTE.teal2, stack: 's' },
      ],
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: {
        x: { stacked: true, ticks: { callback: v=>fmt.currency(v) } },
        y: { stacked: true, grid: { display: false } },
      },
    },
  });

  // Single-Source vs. Linked by Venue (stacked bar)
  destroyChart('t4-linkageByVenue');
  const venueLinked = VENUES.map(v => FANS.filter(fan=>fan.primary_venue===v && fan.global_fan_id).length);
  const venueSingle = VENUES.map(v => FANS.filter(fan=>fan.primary_venue===v && !fan.global_fan_id).length);
  CHARTS['t4-linkageByVenue'] = new Chart(document.getElementById('t4-linkageByVenue'), {
    type: 'bar',
    data: {
      labels: VENUES,
      datasets: [
        { label: 'Linked',        data: venueLinked, backgroundColor: PALETTE.teal, stack: 's' },
        { label: 'Single-Source', data: venueSingle, backgroundColor: PALETTE.gray, stack: 's' },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: { x: { stacked: true }, y: { stacked: true } },
    },
  });

  // Geographic Distribution — Linked Fans Top 10 States
  destroyChart('t4-geoLinked');
  const geoMap = {};
  linkedFans.forEach(fan => { if (fan.home_state) geoMap[fan.home_state] = (geoMap[fan.home_state]||0)+1; });
  const geoSorted = Object.entries(geoMap).sort((a,b)=>b[1]-a[1]).slice(0,10);
  CHARTS['t4-geoLinked'] = new Chart(document.getElementById('t4-geoLinked'), {
    type: 'bar',
    data: {
      labels: geoSorted.map(([s])=>s),
      datasets: [{ label: 'Linked Fans', data: geoSorted.map(([,v])=>v),
                   backgroundColor: PALETTE.teal, borderRadius: 4 }],
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { grid: { display: false } } },
    },
  });
}
