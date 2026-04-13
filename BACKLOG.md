# Rangers Fan Identity Demo — Backlog

## Bugs

~~- **March SEASONALITY index is 0**~~ ✓ Fixed — `SEASONALITY[2]` set to `0.88` (Opening Day series).

~~- **Choropleth tooltip leaks on re-render**~~ ✓ Fixed — `renderStateMap` now removes all `.map-d3-tip` elements before appending a new one.

~~- **Beer & Wine revenue over-sums in summer**~~ ✓ Fixed — summer months shift 3 pts from `non_alc` to `beer_wine` (0.15/0.41) so fractions always sum to 1.0.

~~- **Export silently no-ops on empty results**~~ ✓ Fixed — `downloadCSV` calls `showExportEmpty()` which surfaces a red toast for 3 seconds.

## Enhancements

~~- **`stm_utilization` is null for dark fans**~~ ✓ Fixed — 'Secondary Market Dark Fans' BAN now has a `[data-tooltip]` callout explaining STM utilization is undefined for this segment and why (no Ticketmaster record).

- **`resetTab` key mapping is fragile** — uses `.replace(/^t\d-/, '')` regex to map select IDs back to STATE keys. Works for all current IDs but would silently break if ID naming diverges. Low risk for this demo.

~~- **F&B subcategory filter — extend to other charts**~~ ✓ Fixed — Charts 1, 4, and 5 now respect `fnbDrilldown`. Chart 1 shows category revenue per game with category per-cap tooltip. Chart 4 swaps attach rate for category per-cap by opponent with ±diff tooltip. Chart 5 scales section per-cap by season-level category share with category-prefixed tooltip.

~~- **Logo sizing on narrow viewports**~~ ✓ Fixed — `#logo-area img` capped at `max-width: 120px`.

~~- **Informational ⓘ tooltips on all chart titles**~~ ✓ Fixed — All 23 chart titles across all 4 tabs now have ⓘ icons with explanatory tooltips using the existing `[data-tooltip]` CSS pattern.

~~- **Top Decile: total value label at bar end**~~ ✓ Fixed — Inline `afterDraw` plugin renders total cross-channel spend at the right end of each stacked horizontal bar. No new dependency needed.

~~- **Purchase Timing: Daniel's pacing benchmarks as annotation lines**~~ ✓ Fixed — light red zone on `0–3 days` ("~13% day-of"), dashed benchmark lines at `4–7 days` ("Day 4 — 70% SG target") and `15–30 days` ("Day 17 — 78% budget"). ⓘ tooltip added to chart title with benchmark context.

## Data Issues (low-variance / thin data — revisit before live demo)

~~- **362 linked fans is a low count**~~ ✓ Fixed — Scaled to 3,000 total fans (2,172 linked, 252 dark fans). Match banner updated.

~~- **Arrival Distribution shows near-zero variance**~~ ✓ Fixed — `ARR_SEASONAL` lookup injects monthly shifts: Opening Day +7% early arrivals, Aug Texas heat +6% late arrivals. Chart now shows meaningful seasonal pattern.

~~- **LSM Scan Rate flatlines**~~ ✓ Fixed — `STM_NS_MONTHLY` replaces flat base. Lone Star scan rate now ranges ~92% (Aug) to ~98.5% (Mar/Apr), ~6–7pt seasonal swing on the line chart.

~~- **Food subcategories (hot dogs, beer)**~~ ✓ Fixed — Chart 3 (Revenue by Category) now supports click-through drill-down to subcategories (Hot Dogs, Nachos & Tex-Mex, BBQ & Sandwiches, Pizza, Desserts & Snacks; Domestic Beer, Craft Beer, Hard Seltzer, Wine; Fountain Soda, Bottled Water, Lemonade, Dirty Sodas & Mocktails). Horizontal bar shows season revenue + unit count per subcategory. Top Category BAN updates to Top Sub-Category with dollar amount and units.

## Tooltip Quality Audit (high priority before live demo)

~~- **ⓘ chart title tooltip accuracy review**~~ ✓ Fixed — Ticket Pacing colors corrected (blue/gray/red not green/amber/red). Membership Tier scatter axes corrected (X = tier, Y = total spend). All 23 ⓘ tooltips verified against live chart implementations.

~~- **Full hover tooltip review using frontend-design skill**~~ ✓ Fixed — All 17 hover tooltip callbacks rewritten. Every tooltip now surfaces comparative insight (±diff vs. avg, % of total, multipliers, narrative context) rather than echoing the axis value. Membership Tier scatter fixed to nearest+intersect mode. Venn diagram expanded to describe all 7 segments. Top Decile title now shows tier + section + state.

## Feature Ideas

- **Ticket Pacing: bar-in-bar visualization** — Replace the current annotation-line approach (dashed lines at 70% and 78%) with a bar-in-bar chart where the outer bar represents the dynamic per-game target (based on days-out: 88% day-of, 70% at Day 4, 78% at Day 17) and the inner bar shows actual % sold. The gap or overhang between them is instantly readable without requiring the viewer to find a floating reference line. Implementation: render two datasets — a background bar at `target` opacity and a foreground bar at `pctSold`, both on the same y-axis. Replaces `floor70` and `target78` annotations in `t2-ticketPacing`.

- **Membership Tier scatter: richer hover tooltip** — Current tooltip shows only `$X,XXX` (total cross-channel spend). Should surface: fan's spend breakdown (Tickets / F&B), their tier label, and seat section. Requires attaching extra properties to each scatter data point (`{x, y, ticketSpend, fnbSpend, section, tier}`) so `ctx.raw` in the tooltip callback can access them. Example tooltip: "Lone Star Member · Lexus Club / Ticket: $3,200 / F&B: $890 / Total: $4,090". Affects `scatterDatasets` construction and the tooltip callback in `t4-spendByTier`.



- **Gate Access: stadium interior gate heatmap** — Add a new chart to Tab 1 showing a schematic of Globe Life Field's gate layout with each entrance colored by scan volume (fans scanned through that gate). Color scale: light → dark navy or light → Rangers red for high volume. Data source: extend `GAME_SCANS` to include a `gate` field or derive gate assignment from `section` ranges. Requires an SVG or canvas-drawn stadium outline.

- **Gate heatmap: arrival distribution tooltip on hover** — When hovering over a gate on the stadium heatmap, show a mini sparkline/thumbnail of the arrival distribution for that specific gate (fans arriving in 15-min buckets, same data as the main arrival distribution chart but filtered to that gate). Reuse the existing `map-tooltip` div pattern from the choropleth map.

- **Gate heatmap: click-to-filter Gate Access tab** — Clicking a gate on the stadium heatmap sets a gate-level filter that drives all other Tab 1 charts (attendance/no-show, arrival distribution, no-show by type, STM scan rate, group scan donut) to show only fans who entered through that gate. Requires adding a `gate` dimension to the Tab 1 STATE sub-object and threading it through `filterGames()` / scan row lookups. "Clear gate filter" returns to all-gates view.

- **Ticket Sales: stadium interior section heatmap** — Add a new chart to Tab 2 showing a schematic of Globe Life Field's seating bowl with each section colored by tickets sold or average ticket revenue. Useful for surfacing which sections over/under-index on demand, and pairs naturally with the secondary market price tier chart. Data source: add a `section` dimension to `GAME_TICKETS` and aggregate per section. Same SVG/canvas approach as the gate heatmap above.
