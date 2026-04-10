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

- **Purchase Timing: Daniel's pacing benchmarks as annotation lines** — Daniel Goldberg (Rangers analytics) has a live at-risk dashboard keyed to days-out thresholds: 78% of ticket budget sold by day 17, 70% single-game by day 4, 13% sold day-of. Add vertical annotation lines at days 17, 4, and 1 to the `t2-purchaseTiming` histogram using `chartjs-plugin-annotation`, labeled with these targets. Potentially add a second y-axis or cumulative line showing pacing-to-date. This makes the chart legible in the same vocabulary Daniel's leadership already uses.

## Feature Ideas

- **Gate Access: stadium interior gate heatmap** — Add a new chart to Tab 1 showing a schematic of Globe Life Field's gate layout with each entrance colored by scan volume (fans scanned through that gate). Color scale: light → dark navy or light → Rangers red for high volume. Data source: extend `GAME_SCANS` to include a `gate` field or derive gate assignment from `section` ranges. Requires an SVG or canvas-drawn stadium outline.

- **Gate heatmap: arrival distribution tooltip on hover** — When hovering over a gate on the stadium heatmap, show a mini sparkline/thumbnail of the arrival distribution for that specific gate (fans arriving in 15-min buckets, same data as the main arrival distribution chart but filtered to that gate). Reuse the existing `map-tooltip` div pattern from the choropleth map.

- **Gate heatmap: click-to-filter Gate Access tab** — Clicking a gate on the stadium heatmap sets a gate-level filter that drives all other Tab 1 charts (attendance/no-show, arrival distribution, no-show by type, STM scan rate, group scan donut) to show only fans who entered through that gate. Requires adding a `gate` dimension to the Tab 1 STATE sub-object and threading it through `filterGames()` / scan row lookups. "Clear gate filter" returns to all-gates view.

- **Ticket Sales: stadium interior section heatmap** — Add a new chart to Tab 2 showing a schematic of Globe Life Field's seating bowl with each section colored by tickets sold or average ticket revenue. Useful for surfacing which sections over/under-index on demand, and pairs naturally with the secondary market price tier chart. Data source: add a `section` dimension to `GAME_TICKETS` and aggregate per section. Same SVG/canvas approach as the gate heatmap above.
