# F&B Drill-Down Extension — Charts 1, 4, 5 Design Spec

**Date:** 2026-04-13
**Project:** Texas Rangers Fan Identity Demo
**Feature:** Extend `fnbDrilldown` state to Charts 1, 4, and 5 on the F&B tab

---

## Overview

When a user drills into an F&B category via Chart 3 (setting `STATE.tab3.fnbDrilldown` to `'food'`, `'beer_wine'`, or `'non_alc'`), Charts 1, 4, and 5 currently still show top-level data. This spec extends the drill-down context to all three remaining charts so the entire tab reflects the selected category.

`fnbDrilldown` is a category-level key — it scopes Charts 1/4/5 to food, beer & wine, or non-alcoholic revenue, not to a single subcategory.

---

## Data

No changes to `data.js`. All three charts derive from existing `GAME_FNB` fields:

- `${drillKey}_revenue` per game row (already present)
- `avg_per_cap` and `total_revenue` per game row (used to back-derive `tickets_scanned`)
- Fan-level `fnb_spend` and `fnb_visit_count` (Chart 5, unchanged source)

**Key derivations:**

```js
// Category per-cap for a game (used in Charts 1 and 4)
const catPerCap = fnb.avg_per_cap * (fnb[drillRevField] / fnb.total_revenue);

// tickets_scanned back-derived (used in Chart 4 opponent aggregation)
const ticketsScanned = fnb.total_revenue / fnb.avg_per_cap;

// Season-level category share (used in Chart 5)
const catSeasonRev = GAME_FNB.reduce((s, r) => s + r[drillRevField], 0);
const totalSeasonRev = GAME_FNB.reduce((s, r) => s + r.total_revenue, 0);
const categoryShare = catSeasonRev / totalSeasonRev;

// Fan category per-visit (used in Chart 5)
const catPerVisit = (fnb_spend / fnb_visit_count) * categoryShare;
```

---

## Chart 1 — F&B Revenue by Game (line)

**Trigger:** `f.fnbDrilldown` is set.

**Revenue field:** `drillRevField = `${f.fnbDrilldown}_revenue`` — overrides `catRevField` for this chart regardless of the `fnbCategory` dropdown value. When not drilled in, `catRevField` is used as before.

**Dataset label:** Changes from `"F&B Revenue"` to e.g. `"Food Revenue"` / `"Beer & Wine Revenue"` / `"Non-Alcoholic Revenue"`. Uses `catLabels[f.fnbDrilldown]`.

**Season avg line** (opponent-focused mode): uses `drillRevField` instead of `catRevField`.

**Tooltip `afterBody`:** In drill-down mode, replaces `Per-cap: $X.XX · Attach: XX%` with:
```
Food per-cap: $8.90  ·  44% of game F&B
```
- Category per-cap = `fnb.avg_per_cap × (fnb[drillRevField] / fnb.total_revenue)`
- Category share = `fnb[drillRevField] / fnb.total_revenue`, formatted as `fmt.pct()`
- Label prefix uses `catLabels[f.fnbDrilldown]`

When not drilled in, Chart 1 is completely unchanged.

---

## Chart 4 — Attach Rate / Per-Cap by Opponent (horizontal bar)

**Trigger:** `f.fnbDrilldown` is set.

**Metric swap:** Attach rate (`fnb_attach_rate`) is replaced with category per-cap per opponent.

**Per-opponent computation:**
```js
// For each opponent, aggregate across all games
const drillRevField = `${f.fnbDrilldown}_revenue`;
const oppData = {};
GAME_FNB.forEach(r => {
  const g = GAME_BY_ID[r.game_id];
  if (!g) return;
  if (!oppData[g.opponent]) oppData[g.opponent] = { catRev: 0, scanned: 0 };
  oppData[g.opponent].catRev   += r[drillRevField];
  oppData[g.opponent].scanned  += r.total_revenue / r.avg_per_cap; // back-derive tickets_scanned
});
const oppPerCapSorted = Object.entries(oppData)
  .map(([opp, d]) => ({ opp, perCap: d.scanned > 0 ? d.catRev / d.scanned : 0 }))
  .sort((a, b) => b.perCap - a.perCap);
```

**Chart title:** `"F&B Attach Rate by Opponent"` → `"Food Per-Cap by Opponent"` (dynamic DOM update via `id="t3-attachByOpponent-title"`). Uses `catLabels[f.fnbDrilldown] + ' Per-Cap by Opponent'`.

**X-axis:** relabeled from `fmt.pct(v)` to `'$' + v.toFixed(2)`.

**Colors:** unchanged — selected opponent stays `PALETTE.redSoft`, others `PALETTE.navy`.

**Tooltip:** same `±diff vs. avg` pattern, currency not percent:
```
Food per-cap: $8.90
+$0.42 vs. opponent avg
```

When not drilled in, Chart 4 renders exactly as today (attach rate by opponent, unchanged).

---

## Chart 5 — Per-Cap Spend by Seating Area (bar)

**Trigger:** `f.fnbDrilldown` is set.

**Scaling:** Compute `categoryShare` once from `GAME_FNB` totals, then scale each fan's per-visit spend:

```js
const drillRevField = `${f.fnbDrilldown}_revenue`;
const categoryShare = GAME_FNB.reduce((s, r) => s + r[drillRevField], 0)
                    / GAME_FNB.reduce((s, r) => s + r.total_revenue, 0);

// In the section aggregation loop:
const catPerVisit = f2.fnb_spend && f2.fnb_visit_count
  ? (f2.fnb_spend / f2.fnb_visit_count) * categoryShare
  : 0;
```

**Tooltip:** Same `×section average` multiplier structure, label prefixed with category:
```
Food per-cap: $8.45 per visit
2.1× section average
```

**Inline bar labels** (`sectionLabelPlugin`): naturally reflects the scaled values — no plugin changes needed.

**Chart title:** stays `"Per-Cap Spend by Seating Area"` — category context is clear from tooltip label prefix.

When not drilled in, Chart 5 is completely unchanged.

---

## Files Changed

| File | Change |
|------|--------|
| `src/shell.html` | Add `id="t3-attachByOpponent-title"` to Chart 4's title div |
| `src/charts.js` | Update Chart 1, Chart 4, Chart 5 render blocks in `renderTab3()` |

---

## Out of Scope

- Second-level subcategory drill-down (selecting a single subcategory like Hot Dogs to drive all charts)
- Chart 2 (Per-Cap by Day Type) — not affected by drill-down in this iteration
- Any new state keys beyond existing `fnbDrilldown`
