# Rangers Fan Identity Demo — Backlog

## Bugs

~~- **March SEASONALITY index is 0**~~ ✓ Fixed — `SEASONALITY[2]` set to `0.88` (Opening Day series).

~~- **Choropleth tooltip leaks on re-render**~~ ✓ Fixed — `renderStateMap` now removes all `.map-d3-tip` elements before appending a new one.

~~- **Beer & Wine revenue over-sums in summer**~~ ✓ Fixed — summer months shift 3 pts from `non_alc` to `beer_wine` (0.15/0.41) so fractions always sum to 1.0.

~~- **Export silently no-ops on empty results**~~ ✓ Fixed — `downloadCSV` calls `showExportEmpty()` which surfaces a red toast for 3 seconds.

## Enhancements

- **`stm_utilization` is null for dark fans** — SCAN+FNB-only fans have no ticket record, so utilization is undefined. Consider calling this out explicitly in the Tab 4 BAN tooltip or Venn tooltip to reinforce the CRM blind spot narrative.

- **`resetTab` key mapping is fragile** — uses `.replace(/^t\d-/, '')` regex to map select IDs back to STATE keys. Works for all current IDs but would silently break if ID naming diverges. Low risk for this demo.

~~- **Logo sizing on narrow viewports**~~ ✓ Fixed — `#logo-area img` capped at `max-width: 120px`.

- **Informational ⓘ tooltips on all chart titles** — each chart card should have a small ⓘ icon in the title area that shows an explanatory tooltip on hover. Currently only Tab 4 BANs have tooltips. The `[data-tooltip]` CSS pattern is already in `style.css` — this is a charts.js + shell.html wiring task, adding tooltip text per chart. Port approach from Belmont build.

- **Top Decile: total value label at bar end** — the fan's total cross-channel spend is surfaced in the hover tooltip (`afterBody`) but not visible on the chart itself. Add a datalabels-style label at the right end of each stacked bar showing the total `$X,XXX`. Either via a third transparent dataset with Chart.js datalabels plugin, or a custom `afterDraw` plugin. Makes the ranking self-explanatory without hover. Affects: `src/charts.js` (t4-topDecile options).

~~- **Purchase Timing: Daniel's pacing benchmarks as annotation lines**~~ ✓ Fixed — light red zone on `0–3 days` ("~13% day-of"), dashed benchmark lines at `4–7 days` ("Day 4 — 70% SG target") and `15–30 days` ("Day 17 — 78% budget"). ⓘ tooltip added to chart title with benchmark context.

## Feature Ideas

- **Gate Access: stadium interior gate heatmap** — Add a new chart to Tab 1 showing a schematic of Globe Life Field's gate layout with each entrance colored by scan volume (fans scanned through that gate). Color scale: light → dark navy or light → Rangers red for high volume. Data source: extend `GAME_SCANS` to include a `gate` field or derive gate assignment from `section` ranges. Requires an SVG or canvas-drawn stadium outline.

- **Gate heatmap: arrival distribution tooltip on hover** — When hovering over a gate on the stadium heatmap, show a mini sparkline/thumbnail of the arrival distribution for that specific gate (fans arriving in 15-min buckets, same data as the main arrival distribution chart but filtered to that gate). Reuse the existing `map-tooltip` div pattern from the choropleth map.

- **Gate heatmap: click-to-filter Gate Access tab** — Clicking a gate on the stadium heatmap sets a gate-level filter that drives all other Tab 1 charts (attendance/no-show, arrival distribution, no-show by type, STM scan rate, group scan donut) to show only fans who entered through that gate. Requires adding a `gate` dimension to the Tab 1 STATE sub-object and threading it through `filterGames()` / scan row lookups. "Clear gate filter" returns to all-gates view.

- **Ticket Sales: stadium interior section heatmap** — Add a new chart to Tab 2 showing a schematic of Globe Life Field's seating bowl with each section colored by tickets sold or average ticket revenue. Useful for surfacing which sections over/under-index on demand, and pairs naturally with the secondary market price tier chart. Data source: add a `section` dimension to `GAME_TICKETS` and aggregate per section. Same SVG/canvas approach as the gate heatmap above.
