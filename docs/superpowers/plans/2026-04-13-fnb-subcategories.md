# F&B Subcategory Drill-Down Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a subcategory drill-down to the F&B tab so clicking a category bar in Chart 3 reveals a horizontal bar ranking subcategories by season revenue, and the Top Category BAN updates to show the top subcategory with dollar amount and unit count.

**Architecture:** Fixed season-level subcategory splits (`FNB_SUBCATS` constant in `data.js`) drive a two-state Chart 3 — top-level stacked bar or drill-down horizontal bar — controlled by `STATE.tab3.fnbDrilldown`. All changes are isolated to Chart 3 and the 4th BAN; no other charts are affected.

**Tech Stack:** Vanilla JS, Chart.js 4.x (already loaded via CDN), `node build.js` concatenates src files → `index.html`. No new dependencies.

---

## File Map

| File | Change |
|------|--------|
| `src/data.js` | Add `FNB_SUBCATS` constant after `GAME_FNB` block |
| `src/filters.js` | Add `fnbDrilldown: null` to `STATE.tab3` |
| `src/main.js` | Add `fnbDrilldown: null` to `TAB_DEFAULTS.tab3`; wire back-link click handler |
| `src/shell.html` | Add `id` to Chart 3 title div; add hidden back-link div above canvas |
| `src/charts.js` | Branch Chart 3 render (top-level vs. drill-down); update 4th BAN |
| `BACKLOG.md` | Add backlog item for extending subcategory filter to Charts 1, 4, 5 |

---

## Task 1: Add `FNB_SUBCATS` to `src/data.js`

**Files:**
- Modify: `src/data.js` (after line 272 — the `console.log` after `GAME_FNB`)

- [ ] **Step 1: Add the constant**

Open `src/data.js`. Find this line (around line 272):
```js
console.log('GAME DATA OK — FnB season total $' + (totalFnBRev / 1e6).toFixed(1) + 'M');
```

Insert immediately after it:
```js

// ── FNB_SUBCATS — subcategory revenue shares and avg unit prices ──
// share: fraction of parent category season revenue
// avg_price: used to derive unit count = Math.round(revenue / avg_price)
const FNB_SUBCATS = {
  food: [
    { key: 'hot_dogs',        label: 'Hot Dogs',                share: 0.28, avg_price: 8.50  },
    { key: 'nachos_tex_mex',  label: 'Nachos & Tex-Mex',        share: 0.24, avg_price: 11.00 },
    { key: 'bbq_sandwiches',  label: 'BBQ & Sandwiches',        share: 0.20, avg_price: 14.00 },
    { key: 'pizza',           label: 'Pizza',                   share: 0.15, avg_price: 9.50  },
    { key: 'desserts_snacks', label: 'Desserts & Snacks',       share: 0.13, avg_price: 6.00  },
  ],
  beer_wine: [
    { key: 'domestic_beer',   label: 'Domestic Beer',           share: 0.42, avg_price: 10.00 },
    { key: 'craft_beer',      label: 'Craft Beer',              share: 0.31, avg_price: 13.00 },
    { key: 'hard_seltzer',    label: 'Hard Seltzer',            share: 0.14, avg_price: 11.00 },
    { key: 'wine',            label: 'Wine',                    share: 0.13, avg_price: 12.00 },
  ],
  non_alc: [
    { key: 'fountain_soda',   label: 'Fountain Soda',           share: 0.38, avg_price: 5.50  },
    { key: 'bottled_water',   label: 'Bottled Water',           share: 0.27, avg_price: 4.50  },
    { key: 'lemonade',        label: 'Lemonade',                share: 0.18, avg_price: 6.00  },
    { key: 'dirty_mocktails', label: 'Dirty Sodas & Mocktails', share: 0.17, avg_price: 8.00  },
  ],
};
```

- [ ] **Step 2: Commit**

```bash
cd /Users/bvinson/AnthMCP/07_Experiments/fan-identity-demo-rangers
git add src/data.js
git commit -m "feat: add FNB_SUBCATS subcategory data model"
```

---

## Task 2: Add `fnbDrilldown` to STATE and TAB_DEFAULTS

**Files:**
- Modify: `src/filters.js` (line 11 — `tab3` in `STATE`)
- Modify: `src/main.js` (line 101 — `tab3` in `TAB_DEFAULTS`)

- [ ] **Step 1: Update `src/filters.js`**

Find:
```js
  tab3: { dateRange: 'full_season', dayType: 'all', fnbCategory: 'all' },
```

Replace with:
```js
  tab3: { dateRange: 'full_season', dayType: 'all', fnbCategory: 'all', fnbDrilldown: null },
```

- [ ] **Step 2: Update `src/main.js`**

Find (around line 101 in `TAB_DEFAULTS`):
```js
  tab3: { dateRange: 'full_season', dayType: 'all', fnbCategory: 'all' },
```

Replace with:
```js
  tab3: { dateRange: 'full_season', dayType: 'all', fnbCategory: 'all', fnbDrilldown: null },
```

Note: `resetTab('tab3')` calls `Object.assign(STATE.tab3, TAB_DEFAULTS.tab3)`, which will automatically reset `fnbDrilldown` to `null` when the user hits Reset — no extra work needed.

- [ ] **Step 3: Commit**

```bash
git add src/filters.js src/main.js
git commit -m "feat: add fnbDrilldown to STATE.tab3 and TAB_DEFAULTS"
```

---

## Task 3: Add back-link div and title id to `src/shell.html`

**Files:**
- Modify: `src/shell.html` (around line 252 — the Chart 3 card)

- [ ] **Step 1: Update the Chart 3 card**

Find:
```html
        <div class="chart-card">
          <div class="chart-title">Revenue by Category over Season <span class="chart-info-icon" data-tooltip="Monthly F&amp;B revenue split across food, beer/wine, and non-alcoholic.&#10;Beer/wine share peaks in summer; non-alc rises in shoulder months.">ⓘ</span></div>
          <div class="chart-container" style="height:220px"><canvas id="t3-revByCatMonth"></canvas></div>
        </div>
```

Replace with:
```html
        <div class="chart-card">
          <div class="chart-title" id="t3-catMonth-title">Revenue by Category over Season <span class="chart-info-icon" data-tooltip="Monthly F&amp;B revenue split across food, beer/wine, and non-alcoholic.&#10;Beer/wine share peaks in summer; non-alc rises in shoulder months.&#10;Click a category bar to drill into subcategories.">ⓘ</span></div>
          <div id="t3-drilldown-back" style="display:none;margin-bottom:6px;"><a href="#" id="t3-back-link" style="font-size:12px;color:#4A87C8;text-decoration:none;">&#8592; All Categories</a></div>
          <div class="chart-container" style="height:220px"><canvas id="t3-revByCatMonth"></canvas></div>
        </div>
```

Changes: added `id="t3-catMonth-title"` to the title div; updated the tooltip to mention clicking; added the hidden back-link div with `id="t3-drilldown-back"` and a link with `id="t3-back-link"`.

- [ ] **Step 2: Commit**

```bash
git add src/shell.html
git commit -m "feat: add drill-down back-link div and title id to Chart 3 card"
```

---

## Task 4: Wire back-link click handler in `src/main.js`

**Files:**
- Modify: `src/main.js` (after the `wireFilter` calls for tab3, around line 88)

- [ ] **Step 1: Add the click handler**

Find:
```js
wireFilter('t3-fnbCategory', 'tab3', 'fnbCategory');
```

Add immediately after it:
```js
document.getElementById('t3-back-link').addEventListener('click', e => {
  e.preventDefault();
  STATE.tab3.fnbDrilldown = null;
  renderTab3();
});
```

- [ ] **Step 2: Commit**

```bash
git add src/main.js
git commit -m "feat: wire back-link click handler to reset fnbDrilldown"
```

---

## Task 5: Update Chart 3 in `src/charts.js` — two-state render

**Files:**
- Modify: `src/charts.js` — replace the `// ── Chart 3` block inside `renderTab3()`

- [ ] **Step 1: Replace the Chart 3 block**

Find the entire Chart 3 block (from `// ── Chart 3: Revenue by Category over Season` through the closing `});` of `CHARTS['t3-revByCatMonth'] = new Chart(...)`). It looks like this:

```js
  // ── Chart 3: Revenue by Category over Season (stacked bar by month) ──
  destroyChart('t3-revByCatMonth');
  const months3  = [...new Set(GAMES.map(g => g.month))].sort((a, b) => a - b);
  const monthNames3 = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const catColors3 = { food: PALETTE.navy, beer_wine: PALETTE.navySoft, non_alc: PALETTE.gray };
  const catDatasets3 = ['food', 'beer_wine', 'non_alc'].map(cat => ({
    label: catLabels[cat],
    data: months3.map(m => {
      const rows = GAME_FNB.filter(r => GAME_BY_ID[r.game_id]?.month === m);
      return rows.reduce((s, r) => s + r[`${cat}_revenue`], 0);
    }),
    backgroundColor: catColors3[cat],
  }));

  CHARTS['t3-revByCatMonth'] = new Chart(document.getElementById('t3-revByCatMonth'), {
    type: 'bar',
    data: { labels: months3.map(m => monthNames3[m]), datasets: catDatasets3 },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            title: items => monthNames3[months3[items[0]?.dataIndex]] + ' — F&B Revenue by Category',
            label: ctx => {
              const i = ctx.dataIndex;
              const monthTotal = catDatasets3.reduce((s, ds) => s + (ds.data[i] || 0), 0);
              const pct = monthTotal > 0 ? fmt.pct(ctx.raw / monthTotal) : '';
              return `${ctx.dataset.label}: ${fmt.currency(ctx.raw)}  (${pct})`;
            },
          },
        },
      },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, ticks: { callback: v => fmt.currency(v) } },
      },
    },
  });
```

Replace it with:

```js
  // ── Chart 3: Revenue by Category / Subcategory Drill-Down ──
  destroyChart('t3-revByCatMonth');
  const titleEl3 = document.getElementById('t3-catMonth-title');
  const backDiv3 = document.getElementById('t3-drilldown-back');

  if (f.fnbDrilldown) {
    // ── Drill-down state: horizontal bar of subcategories ──
    const drillKey    = f.fnbDrilldown;
    const catRevField3 = `${drillKey}_revenue`;
    const catSeasonRev = GAME_FNB.reduce((s, r) => s + r[catRevField3], 0);
    const subcats3 = FNB_SUBCATS[drillKey]
      .map(sc => ({
        ...sc,
        revenue: Math.round(catSeasonRev * sc.share),
        units:   Math.round(catSeasonRev * sc.share / sc.avg_price),
      }))
      .sort((a, b) => b.revenue - a.revenue);

    if (titleEl3) titleEl3.firstChild.textContent = `${catLabels[drillKey]} — Subcategory Breakdown `;
    if (backDiv3) backDiv3.style.display = '';

    CHARTS['t3-revByCatMonth'] = new Chart(document.getElementById('t3-revByCatMonth'), {
      type: 'bar',
      data: {
        labels: subcats3.map(sc => sc.label),
        datasets: [{
          label: 'Season Revenue',
          data:  subcats3.map(sc => sc.revenue),
          backgroundColor: subcats3.map((_, i) => i === 0 ? PALETTE.red : PALETTE.navy),
          borderRadius: 3,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: {
            title: items => subcats3[items[0]?.dataIndex]?.label || '',
            label: ctx  => fmt.currency(ctx.raw),
            afterBody: items => {
              const sc = subcats3[items[0]?.dataIndex];
              return sc ? [`${fmt.num(sc.units)} units`] : [];
            },
          }},
        },
        scales: {
          x: { ticks: { callback: v => fmt.currency(v) }, grid: { display: false } },
          y: { grid: { display: false } },
        },
      },
    });

  } else {
    // ── Top-level state: stacked bar by month ──
    if (titleEl3) titleEl3.firstChild.textContent = 'Revenue by Category over Season ';
    if (backDiv3) backDiv3.style.display = 'none';

    const months3     = [...new Set(GAMES.map(g => g.month))].sort((a, b) => a - b);
    const monthNames3 = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const catColors3  = { food: PALETTE.navy, beer_wine: PALETTE.navySoft, non_alc: PALETTE.gray };
    const catDatasets3 = ['food', 'beer_wine', 'non_alc'].map(cat => ({
      label: catLabels[cat],
      data: months3.map(m => {
        const rows = GAME_FNB.filter(r => GAME_BY_ID[r.game_id]?.month === m);
        return rows.reduce((s, r) => s + r[`${cat}_revenue`], 0);
      }),
      backgroundColor: catColors3[cat],
    }));

    CHARTS['t3-revByCatMonth'] = new Chart(document.getElementById('t3-revByCatMonth'), {
      type: 'bar',
      data: { labels: months3.map(m => monthNames3[m]), datasets: catDatasets3 },
      options: {
        responsive: true, maintainAspectRatio: false,
        onClick: (e, _elements, chart) => {
          const els = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false);
          if (!els.length) return;
          const catKeys = ['food', 'beer_wine', 'non_alc'];
          const clicked = catKeys[els[0].datasetIndex];
          if (clicked) { STATE.tab3.fnbDrilldown = clicked; renderTab3(); }
        },
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              title: items => monthNames3[months3[items[0]?.dataIndex]] + ' — F&B Revenue by Category',
              label: ctx => {
                const i = ctx.dataIndex;
                const monthTotal = catDatasets3.reduce((s, ds) => s + (ds.data[i] || 0), 0);
                const pct = monthTotal > 0 ? fmt.pct(ctx.raw / monthTotal) : '';
                return `${ctx.dataset.label}: ${fmt.currency(ctx.raw)}  (${pct})`;
              },
            },
          },
        },
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, ticks: { callback: v => fmt.currency(v) } },
        },
      },
    });
  }
```

- [ ] **Step 2: Commit**

```bash
git add src/charts.js
git commit -m "feat: add Chart 3 subcategory drill-down (horizontal bar on click)"
```

---

## Task 6: Update the 4th BAN in `src/charts.js`

**Files:**
- Modify: `src/charts.js` — update the BAN definitions inside `renderTab3()`

- [ ] **Step 1: Replace the Top Category BAN entry**

Find the `renderBANs` call in `renderTab3()`:
```js
  renderBANs('t3-bans', [
    { label: 'Total F&B Revenue',   value: fmt.currency(totalRev) },
    { label: 'Avg Per-Cap Spend',   value: '$' + avgPercap.toFixed(2) },
    { label: 'F&B Attach Rate',     value: fmt.pct(attachRate) },
    { label: 'Top Category',        value: catLabels[topCat], lead: true },
    { label: 'Transactions',        value: fmt.num(totalTx) },
    { label: 'Avg Transaction',     value: '$' + avgTxVal.toFixed(2) },
  ]);
```

Replace with:
```js
  // 4th BAN: Top Category (top-level) or Top Sub-Category (drilled in)
  let topBAN;
  if (f.fnbDrilldown) {
    const catRevField4 = `${f.fnbDrilldown}_revenue`;
    const catSeasonRev4 = GAME_FNB.reduce((s, r) => s + r[catRevField4], 0);
    const topSub = FNB_SUBCATS[f.fnbDrilldown]
      .map(sc => ({ ...sc, revenue: Math.round(catSeasonRev4 * sc.share), units: Math.round(catSeasonRev4 * sc.share / sc.avg_price) }))
      .sort((a, b) => b.revenue - a.revenue)[0];
    topBAN = {
      label: 'Top Sub-Category',
      value: `${topSub.label}<br><span style="font-size:12px;font-weight:400;">${fmt.currency(topSub.revenue)} · ${fmt.num(topSub.units)} units</span>`,
      lead: true,
    };
  } else {
    topBAN = { label: 'Top Category', value: catLabels[topCat], lead: true };
  }

  renderBANs('t3-bans', [
    { label: 'Total F&B Revenue',   value: fmt.currency(totalRev) },
    { label: 'Avg Per-Cap Spend',   value: '$' + avgPercap.toFixed(2) },
    { label: 'F&B Attach Rate',     value: fmt.pct(attachRate) },
    topBAN,
    { label: 'Transactions',        value: fmt.num(totalTx) },
    { label: 'Avg Transaction',     value: '$' + avgTxVal.toFixed(2) },
  ]);
```

Note: `renderBANs` injects `value` as raw HTML (`innerHTML`), so `<br>` and `<span>` parse correctly.

- [ ] **Step 2: Commit**

```bash
git add src/charts.js
git commit -m "feat: update Top Category BAN to show top sub-category when drilled in"
```

---

## Task 7: Update `BACKLOG.md`

**Files:**
- Modify: `BACKLOG.md`

- [ ] **Step 1: Add the backlog item**

Find the `## Enhancements` section. Add this entry after the existing open item about `resetTab` key mapping:

```markdown
- **F&B subcategory filter — extend to other charts** — When `fnbDrilldown` is set, Charts 1 (revenue by game), 4 (attach by opponent), and 5 (per-cap by section) still show top-level data. Extend subcategory context to these charts in a future iteration.
```

- [ ] **Step 2: Commit**

```bash
git add BACKLOG.md
git commit -m "docs: add backlog item for extending subcategory filter to Charts 1, 4, 5"
```

---

## Task 8: Build, verify, and push

**Files:**
- Regenerates: `index.html` (via `node build.js`)

- [ ] **Step 1: Build**

```bash
cd /Users/bvinson/AnthMCP/07_Experiments/fan-identity-demo-rangers
node build.js
```

Expected output:
```
GAME DATA OK — FnB season total $X.XM
FILTERS OK
Built /Users/bvinson/AnthMCP/07_Experiments/fan-identity-demo-rangers/index.html (XXX.X KB)
```

No errors, no assertion failures.

- [ ] **Step 2: Verify in browser**

Open `index.html` locally. Navigate to the F&B tab. Verify:

1. Chart 3 renders as the stacked bar by month (unchanged top-level state)
2. Clicking a colored bar segment (e.g., the navy Food segment) transitions to a horizontal bar showing Food subcategories (Hot Dogs top = red, rest navy)
3. Chart title updates to "Food — Subcategory Breakdown"
4. "← All Categories" link appears above the chart
5. The 4th BAN label reads "Top Sub-Category" with subcategory name, revenue, and unit count
6. Clicking "← All Categories" restores the stacked bar and resets the BAN to "Top Category"
7. Clicking the Reset button also exits the drill-down
8. Clicking an empty area of the chart (axis, padding) does NOT trigger drill-down

- [ ] **Step 3: Commit build output and push**

```bash
git add index.html
git commit -m "feat: F&B subcategory drill-down — Chart 3 click-through + Top Sub-Category BAN"
git push
```
