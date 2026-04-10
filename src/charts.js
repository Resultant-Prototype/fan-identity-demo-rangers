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
  navy:    '#003278',
  navyMid: '#1A4A8A',
  navySoft:'#3D6BA8',
  red:     '#C0111F',
  redSoft: 'rgba(192,17,31,0.55)',
  gray:    '#8B96A5',
  grayDim: 'rgba(139,150,165,0.40)',
  gray2:   '#C5CBD4',
  coral:   '#D85F52',
  teal2:   '#48CAB2',
};

// ── State choropleth map (reused by Tab 1 and Tab 4) ──────────────
function renderStateMap(containerId, stateDataMap, tooltipFn) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  const W = el.clientWidth || 600, H = el.clientHeight || 260;
  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H);
  const projection = d3.geoAlbersUsa().fitSize([W, H], { type: 'Sphere' });
  const path = d3.geoPath().projection(projection);

  const maxVal = Math.max(1, ...Object.values(stateDataMap).map(d => d.count || 0));
  const colorScale = d3.scaleSequential([0, maxVal], t => `rgba(0,50,120,${0.06 + t * 0.85})`);

  d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json').then(us => {
    const features = topojson.feature(us, us.objects.states).features;
    const stateNames = {
      '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT','10':'DE',
      '12':'FL','13':'GA','15':'HI','16':'ID','17':'IL','18':'IN','19':'IA','20':'KS',
      '21':'KY','22':'LA','23':'ME','24':'MD','25':'MA','26':'MI','27':'MN','28':'MS',
      '29':'MO','30':'MT','31':'NE','32':'NV','33':'NH','34':'NJ','35':'NM','36':'NY',
      '37':'NC','38':'ND','39':'OH','40':'OK','41':'OR','42':'PA','44':'RI','45':'SC',
      '46':'SD','47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA','54':'WV',
      '55':'WI','56':'WY',
    };
    const tip = document.createElement('div');
    tip.style.cssText = 'position:fixed;background:#1a1a2e;color:#fff;padding:8px 12px;border-radius:6px;font-size:12px;pointer-events:none;display:none;z-index:9999;';
    document.body.appendChild(tip);

    svg.selectAll('path')
      .data(features)
      .join('path')
      .attr('d', path)
      .attr('fill', d => {
        const abbr = stateNames[String(d.id).padStart(2,'0')];
        const data = stateDataMap[abbr];
        return data ? colorScale(data.count || 0) : '#EEF0F3';
      })
      .attr('stroke', '#fff').attr('stroke-width', 0.5)
      .on('mousemove', (evt, d) => {
        const abbr = stateNames[String(d.id).padStart(2,'0')];
        tip.innerHTML = tooltipFn(abbr, abbr, stateDataMap[abbr]);
        tip.style.display = 'block';
        tip.style.left = (evt.clientX + 12) + 'px';
        tip.style.top  = (evt.clientY - 28) + 'px';
      })
      .on('mouseleave', () => { tip.style.display = 'none'; });
  });
}

// ═══════════════════════════════════════════════
// TAB 1: GATE ACCESS
// ═══════════════════════════════════════════════
function renderTab1() {
  const f = STATE.tab1;
  const { mode, focused, baseline } = filterGames(f);

  const fIds = focused.map(g => g.id);
  const bIds = baseline ? baseline.map(g => g.id) : [];
  const fScans   = getScanRows(fIds);
  const fTickets = getTicketRows(fIds);
  const bScans   = baseline ? getScanRows(bIds) : [];

  // ── BANs ──
  const totalScanned   = fScans.reduce((s, r) => s + r.tickets_scanned, 0);
  const totalSold      = fTickets.reduce((s, r) => s + r.tickets_sold_total, 0);
  const avgAttendance  = fScans.length ? totalScanned / fScans.length : 0;
  const noShowRate     = totalSold > 0 ? (totalSold - totalScanned) / totalSold : 0;
  const earlyArrRate   = fScans.length
    ? fScans.reduce((s, r) => s + r.arr_90plus + r.arr_60to90, 0) / fScans.length : 0;
  const avgTixPerScan  = fScans.length
    ? fScans.reduce((s, r) => s + r.avg_tickets_per_scan, 0) / fScans.length : 0;
  const stmScanRate    = fScans.length
    ? fScans.reduce((s, r) => s + (1 - r.stm_no_show_rate), 0) / fScans.length : 0;

  renderBANs('t1-bans', [
    { label: 'Season Attendance',          value: fmt.num(totalScanned) },
    { label: 'Avg Attendance / Game',      value: fmt.num(Math.round(avgAttendance)) },
    { label: 'No-Show Rate',               value: fmt.pct(noShowRate) },
    { label: 'Early Arrival Rate',         value: fmt.pct(earlyArrRate) },
    { label: 'Avg Tickets Per Scan',       value: avgTixPerScan.toFixed(1) },
    { label: 'Lone Star Member Scan Rate', value: fmt.pct(stmScanRate), lead: true },
  ]);

  // ── Chart 1: Attendance vs. Tickets Sold by Game ──
  destroyChart('t1-attendanceByGame');
  const sortedGames = [...focused].sort((a, b) => a.date.localeCompare(b.date));
  const labels1 = sortedGames.map(g => g.date.slice(5));

  const soldData   = sortedGames.map(g => { const t = fTickets.find(r => r.game_id === g.id); return t ? t.tickets_sold_total : 0; });
  const scanData   = sortedGames.map(g => { const s = fScans.find(r => r.game_id === g.id);   return s ? s.tickets_scanned : 0; });

  const datasets1 = [];
  if (mode === 'focused' && bScans.length) {
    const bSortedGames = [...(baseline || [])].sort((a, b) => a.date.localeCompare(b.date));
    const bSoldData = bSortedGames.map(g => { const t = getTicketRows([g.id])[0]; return t ? t.tickets_sold_total : 0; });
    const bScanData = bSortedGames.map(g => { const s = getScanRows([g.id])[0];   return s ? s.tickets_scanned : 0; });
    datasets1.push(
      { label: 'Sold (other games)',    data: bSoldData,  backgroundColor: PALETTE.grayDim, type: 'bar', xAxisID: 'xBase', hidden: true },
    );
  }
  datasets1.push(
    { label: mode === 'focused' ? `Sold (${STATE.opponent})` : 'Tickets Sold',
      data: soldData, backgroundColor: mode === 'focused' ? PALETTE.redSoft : PALETTE.navySoft,
      type: 'bar', borderRadius: 2 },
    { label: mode === 'focused' ? `Attended (${STATE.opponent})` : 'Tickets Scanned',
      data: scanData, borderColor: PALETTE.navy, backgroundColor: 'rgba(0,50,120,0.06)',
      type: 'line', pointRadius: 0, borderWidth: 2, tension: 0.2, fill: false },
  );

  CHARTS['t1-attendanceByGame'] = new Chart(document.getElementById('t1-attendanceByGame'), {
    type: 'bar',
    data: { labels: labels1, datasets: datasets1 },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            title: items => {
              const g = sortedGames[items[0]?.dataIndex];
              return g ? `${g.date} vs. ${g.opponent}` : '';
            },
            afterBody: items => {
              const i = items[0]?.dataIndex;
              const s = fScans[i];
              return s ? [`No-show: ${fmt.num(s.no_show_count)}`] : [];
            },
          },
        },
      },
      scales: {
        x: { ticks: { maxTicksLimit: 12 }, grid: { display: false } },
        y: { ticks: { callback: v => fmt.num(v) } },
      },
    },
  });

  // ── Chart 2: No-Show Rate by Game ──
  destroyChart('t1-noshowByGame');
  const seasonAvgNoShow = fScans.length ? fScans.reduce((s, r) => s + r.no_show_rate, 0) / fScans.length : 0;
  const noShowColors = fScans.map(r => r.no_show_rate > seasonAvgNoShow ? PALETTE.coral : PALETTE.navySoft);

  CHARTS['t1-noshowByGame'] = new Chart(document.getElementById('t1-noshowByGame'), {
    type: 'bar',
    data: {
      labels: sortedGames.map(g => g.date.slice(5)),
      datasets: [{
        label: 'No-Show Rate',
        data: sortedGames.map(g => { const s = fScans.find(r => r.game_id === g.id); return s ? s.no_show_rate : 0; }),
        backgroundColor: noShowColors,
        borderRadius: 2,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        annotation: {
          annotations: {
            avgLine: {
              type: 'line', yMin: seasonAvgNoShow, yMax: seasonAvgNoShow,
              borderColor: PALETTE.navy, borderWidth: 1, borderDash: [4, 4],
              label: { content: `Season avg ${fmt.pct(seasonAvgNoShow)}`, display: true, position: 'end', font: { size: 10 } },
            },
          },
        },
        tooltip: {
          callbacks: {
            title: items => {
              const g = sortedGames[items[0]?.dataIndex];
              return g ? `${g.date} vs. ${g.opponent}` : '';
            },
            label: ctx => `No-show: ${fmt.pct(ctx.raw)}`,
          },
        },
      },
      scales: {
        x: { ticks: { maxTicksLimit: 12 }, grid: { display: false } },
        y: { ticks: { callback: v => fmt.pct(v) }, max: 0.18 },
      },
    },
  });

  // ── Chart 3: Arrival Distribution ──
  destroyChart('t1-arrivalDist');
  const arrBuckets = ['arr_90plus', 'arr_60to90', 'arr_30to60', 'arr_0to30', 'arr_post_pitch'];
  const arrLabels  = ['90+ min early', '60–90 min', '30–60 min', '0–30 min', 'After first pitch'];
  const arrColors  = [PALETTE.navy, PALETTE.navyMid, PALETTE.navySoft, PALETTE.gray, PALETTE.gray2];
  const arrDatasets3 = [];

  if (mode === 'all') {
    const months = [...new Set(focused.map(g => g.month))].sort((a, b) => a - b);
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthLabels3 = months.map(m => monthNames[m]);
    arrBuckets.forEach((bucket, bi) => {
      arrDatasets3.push({
        label: arrLabels[bi],
        data: months.map(m => {
          const rows = fScans.filter(r => {
            const g = GAME_BY_ID[r.game_id];
            return g && g.month === m;
          });
          return rows.length ? rows.reduce((s, r) => s + r[bucket], 0) / rows.length : 0;
        }),
        backgroundColor: arrColors[bi],
      });
    });
    CHARTS['t1-arrivalDist'] = new Chart(document.getElementById('t1-arrivalDist'), {
      type: 'bar',
      data: { labels: monthLabels3, datasets: arrDatasets3 },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, ticks: { callback: v => fmt.pct(v) }, max: 1 },
        },
      },
    });
  } else {
    const focusedAvg = arrBuckets.map(b => fScans.length ? fScans.reduce((s, r) => s + r[b], 0) / fScans.length : 0);
    const baselineAvg = arrBuckets.map(b => bScans.length ? bScans.reduce((s, r) => s + r[b], 0) / bScans.length : 0);
    arrBuckets.forEach((_, bi) => {
      arrDatasets3.push({
        label: arrLabels[bi],
        data: [focusedAvg[bi], STATE.showSeasonAvg ? baselineAvg[bi] : null],
        backgroundColor: arrColors[bi],
        stack: 'arrival',
      });
    });
    CHARTS['t1-arrivalDist'] = new Chart(document.getElementById('t1-arrivalDist'), {
      type: 'bar',
      data: { labels: [STATE.opponent, 'Season Avg'], datasets: arrDatasets3 },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, ticks: { callback: v => fmt.pct(v) }, max: 1 },
        },
      },
    });
  }

  // ── Chart 4: No-Show Rate by Ticket Type (aggregate horizontal bar) ──
  destroyChart('t1-noshowByType');
  const stmNS    = fScans.reduce((s, r) => s + r.stm_no_show_rate, 0) / (fScans.length || 1);
  const singleNS = fScans.reduce((s, r) => s + r.single_no_show_rate, 0) / (fScans.length || 1);
  const secNS    = fScans.reduce((s, r) => s + r.secondary_no_show_rate, 0) / (fScans.length || 1);

  CHARTS['t1-noshowByType'] = new Chart(document.getElementById('t1-noshowByType'), {
    type: 'bar',
    data: {
      labels: ['Lone Star Member', 'Single Game', 'Secondary Market'],
      datasets: [{
        label: 'No-Show Rate',
        data: [stmNS, singleNS, secNS],
        backgroundColor: [PALETTE.navy, PALETTE.navyMid, PALETTE.navySoft],
        borderRadius: 4,
      }],
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const ratio = ctx.dataIndex === 2 ? (secNS / stmNS).toFixed(1) : null;
              return ratio
                ? `${fmt.pct(ctx.raw)} — ${ratio}× the Lone Star Member rate`
                : fmt.pct(ctx.raw);
            },
          },
        },
      },
      scales: {
        x: { ticks: { callback: v => fmt.pct(v) } },
        y: { grid: { display: false } },
      },
    },
  });

  // ── Chart 5: Lone Star Member Scan Rate by Month ──
  destroyChart('t1-stmScanRate');
  const months5 = [...new Set(focused.map(g => g.month))].sort((a, b) => a - b);
  const monthNames5 = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const stmByMonth = months5.map(m => {
    const rows = fScans.filter(r => { const g = GAME_BY_ID[r.game_id]; return g && g.month === m; });
    return rows.length ? rows.reduce((s, r) => s + (1 - r.stm_no_show_rate), 0) / rows.length : 0;
  });

  CHARTS['t1-stmScanRate'] = new Chart(document.getElementById('t1-stmScanRate'), {
    type: 'line',
    data: {
      labels: months5.map(m => monthNames5[m]),
      datasets: [{
        label: 'Lone Star Member Scan Rate',
        data: stmByMonth,
        borderColor: PALETTE.navy,
        backgroundColor: `rgba(0,50,120,0.07)`,
        fill: true, pointRadius: 4, borderWidth: 2, tension: 0.3,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { ticks: { callback: v => fmt.pct(v) }, min: 0.80, max: 1.0 },
      },
    },
  });

  // ── Chart 6: Group Scan Distribution (donut) ──
  destroyChart('t1-groupScanDist');
  const soloAvg    = fScans.length ? fScans.reduce((s, r) => s + r.solo_scan_pct, 0) / fScans.length : 0;
  const group23Avg = fScans.length ? fScans.reduce((s, r) => s + r.group_2to3_pct, 0) / fScans.length : 0;
  const group4Avg  = fScans.length ? fScans.reduce((s, r) => s + r.group_4plus_pct, 0) / fScans.length : 0;

  CHARTS['t1-groupScanDist'] = new Chart(document.getElementById('t1-groupScanDist'), {
    type: 'doughnut',
    data: {
      labels: ['Solo (1 ticket)', 'Small Group (2–3)', 'Large Group (4+)'],
      datasets: [{ data: [soloAvg, group23Avg, group4Avg],
                   backgroundColor: [PALETTE.navy, PALETTE.navyMid, PALETTE.navySoft], borderWidth: 0 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '65%',
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              return `${ctx.label}: ${fmt.pct(ctx.raw / total)}`;
            },
          },
        },
      },
    },
  });
}

// ═══════════════════════════════════════════════
// TAB 2: TICKET SALES
// ═══════════════════════════════════════════════
function renderTab2() {
  const f = STATE.tab2;
  const { mode, focused, baseline } = filterGames(f);

  const fIds     = focused.map(g => g.id);
  const fTickets = getTicketRows(fIds);
  const fScans   = getScanRows(fIds);
  const fans2    = filterFans(f, 'tab2');

  // ── BANs ──
  const totalSold   = fTickets.reduce((s, r) => s + r.tickets_sold_total, 0);
  const totalRev    = fTickets.reduce((s, r) => s + r.gross_revenue, 0);
  const avgTktVal   = totalSold > 0 ? totalRev / totalSold : 0;
  const secShare    = fTickets.length ? fTickets.reduce((s, r) => s + r.secondary_market_share, 0) / fTickets.length : 0;
  const stmScanRate = fScans.length ? fScans.reduce((s, r) => s + (1 - r.stm_no_show_rate), 0) / fScans.length : 0;
  const stateCount  = {};
  fans2.forEach(f2 => { if (f2.ticket_state) stateCount[f2.ticket_state] = (stateCount[f2.ticket_state] || 0) + 1; });
  const topState = Object.entries(stateCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'TX';

  renderBANs('t2-bans', [
    { label: 'Tickets Sold',               value: fmt.num(totalSold) },
    { label: 'Gross Revenue',              value: fmt.currency(totalRev) },
    { label: 'Avg Ticket Value',           value: '$' + Math.round(avgTktVal) },
    { label: 'Secondary Market Share',     value: fmt.pct(secShare) },
    { label: 'Lone Star Member Scan Rate', value: fmt.pct(stmScanRate) },
    { label: 'Top State',                  value: topState, lead: true },
  ]);

  const sortedGames2 = [...focused].sort((a, b) => a.date.localeCompare(b.date));

  // ── Chart 1: Tickets Sold by Game (line) ──
  destroyChart('t2-soldByGame');
  const soldByGame  = sortedGames2.map(g => { const t = fTickets.find(r => r.game_id === g.id); return t ? t.tickets_sold_total : 0; });
  const datasets21  = [{ label: 'Tickets Sold', data: soldByGame, borderColor: PALETTE.navy,
                          backgroundColor: 'rgba(0,50,120,0.07)', fill: true, pointRadius: 0, borderWidth: 2, tension: 0.2 }];
  if (mode === 'focused' && STATE.showSeasonAvg) {
    const bIds2 = (baseline || []).map(g => g.id);
    const bTickets = getTicketRows(bIds2);
    const bAvg = bTickets.length ? bTickets.reduce((s, r) => s + r.tickets_sold_total, 0) / bTickets.length : 0;
    datasets21.push({ label: 'Season Avg', data: sortedGames2.map(() => bAvg),
                      borderColor: PALETTE.grayDim, borderDash: [4, 4], pointRadius: 0, borderWidth: 1, fill: false });
  }

  CHARTS['t2-soldByGame'] = new Chart(document.getElementById('t2-soldByGame'), {
    type: 'line',
    data: { labels: sortedGames2.map(g => g.date.slice(5)), datasets: datasets21 },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            title: items => { const g = sortedGames2[items[0]?.dataIndex]; return g ? `${g.date} vs. ${g.opponent}` : ''; },
            afterBody: items => {
              const i = items[0]?.dataIndex;
              const t = fTickets.find(r => r.game_id === sortedGames2[i]?.id);
              return t ? [`STM: ${fmt.num(t.stm_tickets)}  Single: ${fmt.num(t.single_tickets)}  Secondary: ${fmt.num(t.secondary_tickets)}`] : [];
            },
          },
        },
      },
      scales: {
        x: { ticks: { maxTicksLimit: 12 }, grid: { display: false } },
        y: { ticks: { callback: v => fmt.num(v) } },
      },
    },
  });

  // ── Chart 2: Revenue by Ticket Type (stacked bar by game) ──
  destroyChart('t2-revByType');
  CHARTS['t2-revByType'] = new Chart(document.getElementById('t2-revByType'), {
    type: 'bar',
    data: {
      labels: sortedGames2.map(g => g.date.slice(5)),
      datasets: [
        { label: 'Lone Star Member', data: sortedGames2.map(g => { const t = fTickets.find(r => r.game_id === g.id); return t ? t.stm_revenue : 0; }), backgroundColor: PALETTE.navy, borderRadius: 2 },
        { label: 'Single Game',      data: sortedGames2.map(g => { const t = fTickets.find(r => r.game_id === g.id); return t ? t.single_revenue : 0; }), backgroundColor: PALETTE.navyMid },
        { label: 'Secondary Market', data: sortedGames2.map(g => { const t = fTickets.find(r => r.game_id === g.id); return t ? t.secondary_revenue : 0; }), backgroundColor: PALETTE.navySoft },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            title: items => { const g = sortedGames2[items[0]?.dataIndex]; return g ? `${g.date} vs. ${g.opponent}` : ''; },
            footer: () => ['Secondary market revenue is estimated from scan matching — Rangers do not capture this directly'],
          },
        },
      },
      scales: {
        x: { stacked: true, ticks: { maxTicksLimit: 12 }, grid: { display: false } },
        y: { stacked: true, ticks: { callback: v => fmt.currency(v) } },
      },
    },
  });

  // ── Chart 3: Avg Ticket Value by Opponent (horizontal bar, all opponents) ──
  destroyChart('t2-avgValueByOpponent');
  const oppMap = {};
  GAME_TICKETS.forEach(t => {
    const g = GAME_BY_ID[t.game_id];
    if (!g) return;
    if (!oppMap[g.opponent]) oppMap[g.opponent] = { total: 0, count: 0 };
    oppMap[g.opponent].total += t.avg_ticket_value;
    oppMap[g.opponent].count++;
  });
  const oppSorted = Object.entries(oppMap)
    .map(([opp, d]) => ({ opp, avg: Math.round(d.total / d.count) }))
    .sort((a, b) => b.avg - a.avg);

  CHARTS['t2-avgValueByOpponent'] = new Chart(document.getElementById('t2-avgValueByOpponent'), {
    type: 'bar',
    data: {
      labels: oppSorted.map(d => d.opp),
      datasets: [{
        label: 'Avg Ticket Value',
        data: oppSorted.map(d => d.avg),
        backgroundColor: oppSorted.map(d => d.opp === STATE.opponent ? PALETTE.redSoft : PALETTE.navy),
        borderRadius: 3,
      }],
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => '$' + ctx.raw } } },
      scales: { x: { ticks: { callback: v => '$' + v } }, y: { ticks: { font: { size: 11 } }, grid: { display: false } } },
    },
  });

  // ── Chart 4: Secondary Market Share by Game Tier (grouped bar) ──
  destroyChart('t2-secondaryByTier');
  const tiers = ['featured', 'select', 'standard'];
  const tierLabels = ['Featured', 'Select', 'Standard'];
  const tierSecShare = tiers.map(tier => {
    const rows = GAME_TICKETS.filter(t => GAME_BY_ID[t.game_id]?.game_tier === tier);
    return rows.length ? rows.reduce((s, r) => s + r.secondary_market_share, 0) / rows.length : 0;
  });

  CHARTS['t2-secondaryByTier'] = new Chart(document.getElementById('t2-secondaryByTier'), {
    type: 'bar',
    data: {
      labels: tierLabels,
      datasets: [{ label: 'Secondary Market Share', data: tierSecShare,
                   backgroundColor: [PALETTE.navy, PALETTE.navyMid, PALETTE.navySoft], borderRadius: 4 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => fmt.pct(ctx.raw) } } },
      scales: { x: { grid: { display: false } }, y: { ticks: { callback: v => fmt.pct(v) } } },
    },
  });

  // ── Chart 5: Purchase Timing — Days in Advance by Ticket Type (grouped bar) ──
  destroyChart('t2-purchaseTiming');
  const timingBuckets = ['0–3 days', '4–7 days', '8–14 days', '15–30 days', '30+ days'];
  const timingDist = (type) => {
    const rows = GAME_TICKETS;
    const avg = rows.reduce((s, r) => {
      if (type === 'lone_star') return s + 90;
      if (type === 'single_game') return s + r.avg_days_in_advance;
      return s + Math.max(1, r.avg_days_in_advance * 0.3);
    }, 0) / rows.length;
    const center = Math.min(4, Math.max(0, Math.round(avg / 10)));
    return timingBuckets.map((_, i) => {
      const dist = Math.exp(-0.5 * Math.pow(i - center, 2) / 1.5);
      return parseFloat(dist.toFixed(3));
    });
  };

  CHARTS['t2-purchaseTiming'] = new Chart(document.getElementById('t2-purchaseTiming'), {
    type: 'bar',
    data: {
      labels: timingBuckets,
      datasets: [
        { label: 'Lone Star Member', data: timingDist('lone_star'),   backgroundColor: PALETTE.navy,     borderRadius: 3 },
        { label: 'Single Game',      data: timingDist('single_game'), backgroundColor: PALETTE.navyMid,  borderRadius: 3 },
        { label: 'Secondary Market', data: timingDist('secondary'),   backgroundColor: PALETTE.navySoft, borderRadius: 3 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: { x: { grid: { display: false } }, y: { ticks: { callback: v => (v * 100).toFixed(0) + '%' } } },
    },
  });

  // ── Chart 6: Buyers by State — Top 10 (horizontal bar) ──
  destroyChart('t2-buyersByState');
  const stateSorted = Object.entries(stateCount).sort((a, b) => b[1] - a[1]).slice(0, 10);

  CHARTS['t2-buyersByState'] = new Chart(document.getElementById('t2-buyersByState'), {
    type: 'bar',
    data: {
      labels: stateSorted.map(([s]) => s),
      datasets: [{ label: 'Buyers', data: stateSorted.map(([, v]) => v),
                   backgroundColor: PALETTE.navy, borderRadius: 4 }],
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { callback: v => fmt.num(v) } }, y: { grid: { display: false } } },
    },
  });
}
