# F&B Subcategory Drill-Down — Design Spec

**Date:** 2026-04-13
**Project:** Texas Rangers Fan Identity Demo
**Feature:** Food & Beverage Tab — Subcategory Breakdown

---

## Overview

Add a subcategory drill-down to the F&B tab. Clicking a category segment in Chart 3 (Revenue by Category) replaces it with a horizontal bar ranking that category's subcategories by season revenue. The "Top Category" BAN updates to show the top subcategory with dollar amount and unit count when drilled in.

All subcategory data is derived from fixed season-level splits — no per-game variability at the subcategory level.

---

## Data Model

Add a `FNB_SUBCATS` constant to `data.js`. Each entry defines a subcategory's revenue share within its parent category and an average unit price used to derive item count (`Math.round(revenue / avg_unit_price)`).

```js
const FNB_SUBCATS = {
  food: [
    { key: 'hot_dogs',        label: 'Hot Dogs',            share: 0.28, avg_price: 8.50  },
    { key: 'nachos_tex_mex',  label: 'Nachos & Tex-Mex',    share: 0.24, avg_price: 11.00 },
    { key: 'bbq_sandwiches',  label: 'BBQ & Sandwiches',    share: 0.20, avg_price: 14.00 },
    { key: 'pizza',           label: 'Pizza',               share: 0.15, avg_price: 9.50  },
    { key: 'desserts_snacks', label: 'Desserts & Snacks',   share: 0.13, avg_price: 6.00  },
  ],
  beer_wine: [
    { key: 'domestic_beer',   label: 'Domestic Beer',       share: 0.42, avg_price: 10.00 },
    { key: 'craft_beer',      label: 'Craft Beer',          share: 0.31, avg_price: 13.00 },
    { key: 'hard_seltzer',    label: 'Hard Seltzer',        share: 0.14, avg_price: 11.00 },
    { key: 'wine',            label: 'Wine',                share: 0.13, avg_price: 12.00 },
  ],
  non_alc: [
    { key: 'fountain_soda',   label: 'Fountain Soda',       share: 0.38, avg_price: 5.50  },
    { key: 'bottled_water',   label: 'Bottled Water',       share: 0.27, avg_price: 4.50  },
    { key: 'lemonade',        label: 'Lemonade',            share: 0.18, avg_price: 6.00  },
    { key: 'dirty_mocktails', label: 'Dirty Sodas & Mocktails', share: 0.17, avg_price: 8.00 },
  ],
};
```

Season-level subcategory revenue = parent category season total × `share`. Item count = `Math.round(revenue / avg_price)`.

Shares within each category sum to 1.0.

---

## State

Add `fnbDrilldown: null` to `STATE.tab3`. Valid values: `null` (top-level), `'food'`, `'beer_wine'`, `'non_alc'`.

---

## Chart 3 — Two States

### Top-level state (`fnbDrilldown === null`)
Existing stacked bar by month — unchanged. Clicking a bar segment sets `STATE.tab3.fnbDrilldown` to the clicked category key and calls `renderTab3()`.

### Drill-down state (`fnbDrilldown !== null`)
Chart 3 renders as a horizontal bar chart:
- **Labels:** subcategory names for the selected category
- **Data:** season revenue per subcategory, sorted descending
- **Color:** `PALETTE.navy` bars, `PALETTE.red` on the top subcategory
- **Chart title:** `"{Category Label} — Subcategory Breakdown"` (e.g., "Food — Subcategory Breakdown")
- **Tooltip:** subcategory name, season revenue (currency formatted), item count (e.g., "42,800 units")
- **Back link:** a `"← All Categories"` text link rendered above the chart canvas; clicking it sets `fnbDrilldown = null` and calls `renderTab3()`

Chart click handler uses Chart.js `onClick` option. The handler checks `chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false)` — if the array is empty (click missed all bars), it does nothing. If a bar is hit, it reads `elements[0].datasetIndex` to identify which category was clicked.

---

## BAN Update — Top Category

The 4th BAN ("Top Category") has two states:

**Top-level (`fnbDrilldown === null`):**
```
Top Category
Food                    ← lead: true (red)
```

**Drilled-in (`fnbDrilldown !== null`):**
```
Top Sub-Category
Domestic Beer           ← lead: true (red)
$2.1M · 198,400 units
```

Top subcategory = highest revenue entry within the active drill-down category.

The `lead: true` red highlight stays on this BAN in both states. The dollar amount uses `fmt.currency()`, item count uses `fmt.num()` with "units" suffix.

---

## Files Changed

| File | Change |
|------|--------|
| `src/data.js` | Add `FNB_SUBCATS` constant |
| `src/charts.js` | Update `STATE.tab3`, `renderTab3()` — Chart 3 drill-down, BAN swap |
| `BACKLOG.md` | Add backlog item for extending subcategory filter to Charts 1, 4, 5 |

---

## Out of Scope

- Subcategory filter affecting Chart 1 (revenue by game), Chart 4 (attach by opponent), Chart 5 (per-cap by section) — backlogged
- Fan-level subcategory assignment (`fnb_sub_category` on FANS records)
- Per-game subcategory variability

---

## Subcategory Reference (Globe Life Field 2026)

Subcategory labels and shares are grounded in actual Delaware North / Sportservice concession offerings at Globe Life Field for the 2026 season, including the Elote Dawwg, Hawwt Dawwg Biscuits & Gravy, Karbach craft beers, Dirty Sodas, and Mocktails introduced this season.
