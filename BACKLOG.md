# Rangers Fan Identity Demo — Backlog

## Bugs

~~- **March SEASONALITY index is 0**~~ ✓ Fixed — `SEASONALITY[2]` set to `0.88` (Opening Day series).

~~- **Choropleth tooltip leaks on re-render**~~ ✓ Fixed — `renderStateMap` now removes all `.map-d3-tip` elements before appending a new one.

~~- **Beer & Wine revenue over-sums in summer**~~ ✓ Fixed — summer months shift 3 pts from `non_alc` to `beer_wine` (0.15/0.41) so fractions always sum to 1.0.

~~- **Export silently no-ops on empty results**~~ ✓ Fixed — `downloadCSV` calls `showExportEmpty()` which surfaces a red toast for 3 seconds.

## Enhancements

~~- **`stm_utilization` is null for dark fans**~~ ✓ Fixed — 'Secondary Market Dark Fans' BAN now has a `[data-tooltip]` callout explaining STM utilization is undefined for this segment and why (no Ticketmaster record).

- **`resetTab` key mapping is fragile** — uses `.replace(/^t\d-/, '')` regex to map select IDs back to STATE keys. Works for all current IDs but would silently break if ID naming diverges. Low risk for this demo.

~~- **Logo sizing on narrow viewports**~~ ✓ Fixed — `#logo-area img` capped at `max-width: 120px`.

~~- **Informational ⓘ tooltips on all chart titles**~~ ✓ Fixed — All 23 chart titles across all 4 tabs now have ⓘ icons with explanatory tooltips using the existing `[data-tooltip]` CSS pattern.

~~- **Top Decile: total value label at bar end**~~ ✓ Fixed — Inline `afterDraw` plugin renders total cross-channel spend at the right end of each stacked horizontal bar. No new dependency needed.

~~- **Purchase Timing: Daniel's pacing benchmarks as annotation lines**~~ ✓ Fixed — light red zone on `0–3 days` ("~13% day-of"), dashed benchmark lines at `4–7 days` ("Day 4 — 70% SG target") and `15–30 days` ("Day 17 — 78% budget"). ⓘ tooltip added to chart title with benchmark context.

## Data Issues (low-variance / thin data — revisit before live demo)

~~- **362 linked fans is a low count**~~ ✓ Fixed — Scaled to 3,000 total fans (2,172 linked, 252 dark fans). Match banner updated.

~~- **Arrival Distribution shows near-zero variance**~~ ✓ Fixed — `ARR_SEASONAL` lookup injects monthly shifts: Opening Day +7% early arrivals, Aug Texas heat +6% late arrivals. Chart now shows meaningful seasonal pattern.

~~- **LSM Scan Rate flatlines**~~ ✓ Fixed — `STM_NS_MONTHLY` replaces flat base. Lone Star scan rate now ranges ~92% (Aug) to ~98.5% (Mar/Apr), ~6–7pt seasonal swing on the line chart.

- **Food subcategories (hot dogs, beer)** — The F&B tab only shows Food / Beer & Wine / Non-Alcoholic. Rangers front office will ask about specific items. Consider adding sub-category breakdown (hot dogs, nachos, domestic beer, premium beer) either as a separate chart or as tooltip drill-down on the category chart.

## Tooltip Quality Audit (high priority before live demo)

- **ⓘ chart title tooltip accuracy review** — The info tooltips added to all 23 chart titles were written generically and some describe things that don't match the actual chart. Example: Ticket Pacing ⓘ says "Color: green = on/above target · amber = within 10 pts · red = at risk" — but the chart uses Rangers Navy (blue) and Rangers Red, not green and amber. Every ⓘ tooltip needs to be read against the live chart and corrected so the colors, labels, and interactions described match what the viewer is actually seeing. Low effort per tooltip, but requires opening each tab and cross-checking carefully.

- **Full hover tooltip review using frontend-design skill** — Every chart tooltip needs to earn its place. Right now many tooltips just echo the y-axis value (e.g., Membership Tier scatter shows a list of `$1K / $1K / $960 / $930…` for nearby points — zero signal). Use the `frontend-design` skill to go chart by chart and rewrite tooltips so they surface insight that isn't visible on the chart face itself: context, comparison, narrative hook, or actionable interpretation. Tooltip content should answer "so what?" not just "what."

  Priority targets (worst offenders):
  - **Membership Tier scatter** — raw spend values for clustered points; should show tier + section + spend breakdown (this is also tracked under Feature Ideas)
  - **Attendance vs. Tickets Sold** — tooltip should include opponent name, game tier, and promo label if present
  - **No-Show Rate by Game** — should call out whether the game was above/below average and by how much
  - **F&B Revenue by Game** — should include per-cap and attach rate, not just total revenue
  - **Arrival Distribution (opponent mode)** — should compare the opponent's arrival profile vs. season avg in words, not just show bucket fractions
  - **Revenue by Ticket Type** — stacked bar tooltip should show channel mix % alongside dollar values
  - **Geo bar / choropleth** — state tooltip should include % of total, not just count

  Approach: invoke `frontend-design` skill, review each tab's charts.js tooltip callbacks, rewrite for demo narrative quality.

## Feature Ideas

- **Ticket Pacing: bar-in-bar visualization** — Replace the current annotation-line approach (dashed lines at 70% and 78%) with a bar-in-bar chart where the outer bar represents the dynamic per-game target (based on days-out: 88% day-of, 70% at Day 4, 78% at Day 17) and the inner bar shows actual % sold. The gap or overhang between them is instantly readable without requiring the viewer to find a floating reference line. Implementation: render two datasets — a background bar at `target` opacity and a foreground bar at `pctSold`, both on the same y-axis. Replaces `floor70` and `target78` annotations in `t2-ticketPacing`.

- **Membership Tier scatter: richer hover tooltip** — Current tooltip shows only `$X,XXX` (total cross-channel spend). Should surface: fan's spend breakdown (Tickets / F&B), their tier label, and seat section. Requires attaching extra properties to each scatter data point (`{x, y, ticketSpend, fnbSpend, section, tier}`) so `ctx.raw` in the tooltip callback can access them. Example tooltip: "Lone Star Member · Lexus Club / Ticket: $3,200 / F&B: $890 / Total: $4,090". Affects `scatterDatasets` construction and the tooltip callback in `t4-spendByTier`.



- **Gate Access: stadium interior gate heatmap** — Add a new chart to Tab 1 showing a schematic of Globe Life Field's gate layout with each entrance colored by scan volume (fans scanned through that gate). Color scale: light → dark navy or light → Rangers red for high volume. Data source: extend `GAME_SCANS` to include a `gate` field or derive gate assignment from `section` ranges. Requires an SVG or canvas-drawn stadium outline.

- **Gate heatmap: arrival distribution tooltip on hover** — When hovering over a gate on the stadium heatmap, show a mini sparkline/thumbnail of the arrival distribution for that specific gate (fans arriving in 15-min buckets, same data as the main arrival distribution chart but filtered to that gate). Reuse the existing `map-tooltip` div pattern from the choropleth map.

- **Gate heatmap: click-to-filter Gate Access tab** — Clicking a gate on the stadium heatmap sets a gate-level filter that drives all other Tab 1 charts (attendance/no-show, arrival distribution, no-show by type, STM scan rate, group scan donut) to show only fans who entered through that gate. Requires adding a `gate` dimension to the Tab 1 STATE sub-object and threading it through `filterGames()` / scan row lookups. "Clear gate filter" returns to all-gates view.

- **Ticket Sales: stadium interior section heatmap** — Add a new chart to Tab 2 showing a schematic of Globe Life Field's seating bowl with each section colored by tickets sold or average ticket revenue. Useful for surfacing which sections over/under-index on demand, and pairs naturally with the secondary market price tier chart. Data source: add a `section` dimension to `GAME_TICKETS` and aggregate per section. Same SVG/canvas approach as the gate heatmap above.
