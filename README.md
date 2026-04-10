# Fan Identity Resolution Demo — Texas Rangers

A single-page, zero-backend analytics demo built for front-office sales conversations. It simulates what a Rangers analytics team could see when ticket scan data, F&B transactions, and fan CRM records are linked using Resultant's P3RL identity resolution product.

**Live demo:** open `index.html` in any browser. No server required.

---

## What this demo shows

Four tabs, each telling a different part of the story:

| Tab | What it surfaces |
|-----|-----------------|
| **Gate Access** | Attendance vs. no-shows, arrival distribution, STM scan rate, group scan breakdown — all filtered by date range, day type, and promo |
| **Ticket Sales** | Capacity utilization, secondary market pricing, purchase timing (days in advance), per-game ticket revenue |
| **Food & Beverage** | Per-cap spend by category (food, beer & wine, non-alcoholic), per-cap by seating area, seasonality |
| **Fan Identity** | The P3RL story — Venn diagram of SCAN-only / FNB-only / linked fans, spend by membership tier, top-decile fan profiles, choropleth of fan origin by state |

The global **Opponent** filter at the top drives all four tabs simultaneously. When an opponent is selected, time-series charts show the full season timeline with that opponent's games highlighted and the rest dimmed — so the viewer can see context rather than a data void.

---

## Data model

All data is synthetic, seeded deterministically (no `Math.random()`). The same filters always produce the same numbers.

### Core entities (`src/data.js`)

**`GAMES`** — 81 home games derived from `SERIES_SCHEDULE`
```
id, date, opponent, league, rival, tier (featured/select/standard),
day_type (day_game/weekend_friday/weeknight), promo_type, promo_label,
capacity, seasonality_index
```

**`GAME_SCANS`** — one row per game, fan scan metrics
```
game_id, total_scans, stm_scans, group_scans, no_shows,
arr_early, arr_ontime, arr_late  (arrival distribution buckets)
```

**`GAME_TICKETS`** — one row per game, ticketing metrics
```
game_id, sold, face_value_avg, secondary_avg,
adv_0_3, adv_4_7, adv_8_14, adv_15_30, adv_31plus  (purchase timing)
```

**`GAME_FNB`** — one row per game, F&B spend
```
game_id, total_fnb, food, beer_wine, non_alc, per_cap
```

**`FNB_BY_SECTION`** — per-cap spend by seating tier (Lexus Club, Balcones Club, Terrace, etc.)

**`FANS`** — ~362 linked fan records (the P3RL-resolved population)
```
id, segment (STM/Plan/Single/SCAN-only/FNB-only), tier (Lone Star/Club/Terrace/General),
ticket_spend, fnb_spend, home_state, section, stm_utilization
```

### Filter architecture (`src/filters.js`)

`STATE` holds all active filter values. `filterGames(tabFilters)` returns:
```js
{ mode: 'all' | 'focused', focused: Game[], baseline: Game[] | null }
```
- `mode='all'` — opponent filter is "All Opponents"; `focused` = games matching tab filters
- `mode='focused'` — an opponent is selected; `focused` = those games, `baseline` = everything else

Charts that show time series (attendance, no-shows, ticket pacing) use `tlGames` — the full season timeline even in focused mode — so the x-axis never collapses to a small subset.

---

## Build system

**One command:**
```bash
node build.js
```

`build.js` reads `src/shell.html` and inlines `src/style.css` (replacing `{{STYLE}}`) and the concatenated JS modules (replacing `{{SCRIPT}}`) in dependency order:

```
data.js → filters.js → charts.js → export.js → main.js
```

Output: `index.html` — a single fully self-contained file. Open it directly; no build server, no npm install.

**External dependencies loaded from CDN** (no local node_modules needed):
- Chart.js 4.4.2
- chartjs-plugin-annotation 3.0.1
- chartjs-chart-venn 4.3.0
- D3 7.9.0 + TopoJSON 3.1.0 (for the choropleth state map)
- Google Fonts: Lexend Deca + Barlow Condensed

---

## Adapting for a new client

### Minimum changes for a new team

1. **Branding** (`src/style.css` `:root` block)
   - `--navy`: primary brand color
   - `--teal` / `--teal-light`: accent color (used for active tabs, badges, lead BANs)
   - `--accent-red`: negative delta color

2. **Logo + org name** (`src/shell.html`)
   - Replace `RangersLogo.png` with the client's logo file
   - Update the `<img src=...>` path and `#org-name` text

3. **Schedule** (`src/data.js` → `SERIES_SCHEDULE`)
   - Replace the 81-game Rangers schedule with the client's home schedule
   - Keep the same shape: `{ start, opp, lg, rival, n, tier, promo, promoLabel }`
   - The rest of the data (scans, tickets, F&B, fans) derives from this array via the seeded variance functions

4. **Tab labels / P3RL badge copy** (`src/shell.html`) — update any team-specific language

5. **Color palette** (`src/charts.js` → `PALETTE`) — update `navy`, `red`, etc. to match the new brand

### What the LLM working on this needs to know

- **Never edit `index.html` directly.** It is fully generated. All edits go in `src/`, then run `node build.js`.
- Chart rendering functions are in `src/charts.js` and are named `renderTab1()`, `renderTab2()`, etc. Each function re-reads `STATE` and re-draws all charts for that tab.
- Custom Chart.js plugins (label overlays, mean markers) are defined inline as `const xPlugin = { id: ..., afterDraw/afterDatasetsDraw }` and passed in the `plugins:` array of the specific chart config — not registered globally.
- `PALETTE` in `src/charts.js` is the single source of truth for all chart colors. Do not hardcode hex values inside individual chart configs.
- The `[data-tooltip]` CSS pattern in `style.css` drives all the ⓘ icon tooltips on chart titles. To add a tooltip to a chart title, add `data-tooltip="..."` to the `.chart-title` element in `shell.html` and the CSS handles the rest. No JS required.
- `export.js` handles CSV download. `showExportEmpty()` surfaces a red toast if the filtered result is empty.
- The Venn diagram (Tab 4) uses `chartjs-chart-venn`. The three sets are SCAN, FNB, and the intersection — fans who appear in both sources (the P3RL-linked population).

---

## Backlog

See [`BACKLOG.md`](BACKLOG.md) for open bugs, enhancements, data issues, and feature ideas.

---

## Repo structure

```
src/
  shell.html    HTML structure + template slots {{STYLE}} {{SCRIPT}}
  style.css     All brand tokens and component styles
  data.js       Synthetic data: GAMES, GAME_SCANS, GAME_TICKETS, GAME_FNB, FANS
  filters.js    STATE object + filterGames() + helper accessors
  charts.js     All Chart.js / D3 render functions
  export.js     CSV export + toast notifications
  main.js       Tab switching, filter wiring, initial render
build.js        Inlines src/ → index.html (run with: node build.js)
index.html      Generated output — do not edit directly
BACKLOG.md      Known issues and feature ideas
```

---

## About P3RL

P3RL (Probabilistic Record Linkage) is Resultant's identity resolution product. It links fan records across disconnected systems — ticketing platforms, point-of-sale, CRM — without requiring a shared key. The Fan Identity tab demonstrates the business value: understanding spend behavior, segmentation, and geographic reach for fans who would otherwise be invisible in a single-system view.

For more on P3RL, contact your Resultant account team.
