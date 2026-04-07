# Fan Identity Demo — Backlog

Items are roughly prioritized. Reference the src/ file most relevant to each fix.

## Enhancements

- [ ] **Informational tooltips on all charts** — each chart card should have a small ⓘ icon that shows a tooltip explaining what the chart shows and how to read it. Affects: `src/main.js` (tooltip rendering helper) + `src/charts.js` (add tooltip text per chart). Currently only Tab 4 BANs have tooltips.

- [ ] **BANs don't span full screen width** — the `.ban-row` grid uses `minmax(180px, 1fr)` which leaves dead space on wide screens with only 6 BANs. Fix: use `repeat(6, 1fr)` for the 6-BAN layout so cards always fill the row. Affects: `src/style.css`.

- [ ] **Date range filter doesn't update the date axis** — changing the Date Range filter re-computes BANs and aggregates correctly, but the x-axis on time-series charts (Handle by Day, Ticket Purchases Over Time, F&B Revenue by Day) still shows the full year labels. Fix: the filtered `byDayLabels` / `dayLabels` arrays are already sliced correctly — verify Chart.js is using the filtered labels array, not DAILY_ADW directly. Affects: `src/charts.js` renderTab1, renderTab2, renderTab3.

- [ ] **Research true horse racing season; update "Current Season" filter label** — the current preset is a full-year alias. Research actual Thoroughbred racing calendar (Saratoga: late Jul–early Sep; Belmont: May–Jun and Sep–Oct; Aqueduct: Oct–May) and set a meaningful date window. Update the `<option>` label to `Current Season (MMM–MMM)` to show the actual range. Affects: `src/filters.js` (DATE_PRESETS.current_season), `src/shell.html` (option label text in all four filter bars).

- [ ] **BAN text and numbers not centered** — `.ban-label` and `.ban-value` are left-aligned by default. Add `text-align: center` to `.ban-card` (or its children) so the metric name and value are horizontally centered within each card. Affects: `src/style.css`.

- [ ] **Review chart colors against BI best practices** — research color usage guidelines for each chart type in use (line, bar, stacked bar, donut/doughnut, scatter, Venn) and audit the current PALETTE against those standards. Key questions: (1) Are categorical series distinguishable by colorblind users? (2) Do sequential/diverging scales encode data meaning correctly? (3) Is navy-on-navy or teal-on-teal used anywhere that reduces contrast? (4) Should a neutral gray be used for "benchmark/prior year" series instead of navy, which carries brand weight? Proposed fix: replace or supplement PALETTE in `src/charts.js` and update individual chart dataset colors where best practice diverges from current choices. Affects: `src/charts.js`.
