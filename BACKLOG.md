# Fan Identity Demo — Backlog

Items are roughly prioritized. Reference the src/ file most relevant to each fix.

## Enhancements

- [x] **Informational tooltips on all charts** — each chart card should have a small ⓘ icon that shows a tooltip explaining what the chart shows and how to read it. Affects: `src/main.js` (tooltip rendering helper) + `src/charts.js` (add tooltip text per chart). Currently only Tab 4 BANs have tooltips.

- [x] **BANs don't span full screen width** — the `.ban-row` grid uses `minmax(180px, 1fr)` which leaves dead space on wide screens with only 6 BANs. Fix: use `repeat(6, 1fr)` for the 6-BAN layout so cards always fill the row. Affects: `src/style.css`.

- [x] **Date range filter doesn't update the date axis** — changing the Date Range filter re-computes BANs and aggregates correctly, but the x-axis on time-series charts (Handle by Day, Ticket Purchases Over Time, F&B Revenue by Day) still shows the full year labels. Fix: the filtered `byDayLabels` / `dayLabels` arrays are already sliced correctly — verify Chart.js is using the filtered labels array, not DAILY_ADW directly. Affects: `src/charts.js` renderTab1, renderTab2, renderTab3.

- [x] **Research true horse racing season; update "Current Season" filter label** — the current preset is a full-year alias. Research actual Thoroughbred racing calendar (Saratoga: late Jul–early Sep; Belmont: May–Jun and Sep–Oct; Aqueduct: Oct–May) and set a meaningful date window. Update the `<option>` label to `Current Season (MMM–MMM)` to show the actual range. Affects: `src/filters.js` (DATE_PRESETS.current_season), `src/shell.html` (option label text in all four filter bars).

- [x] **BAN text and numbers not centered** — `.ban-label` and `.ban-value` are left-aligned by default. Add `text-align: center` to `.ban-card` (or its children) so the metric name and value are horizontally centered within each card. Affects: `src/style.css`.

- [x] **Review chart colors against BI best practices** — research color usage guidelines for each chart type in use (line, bar, stacked bar, donut/doughnut, scatter, Venn) and audit the current PALETTE against those standards. Key questions: (1) Are categorical series distinguishable by colorblind users? (2) Do sequential/diverging scales encode data meaning correctly? (3) Is navy-on-navy or teal-on-teal used anywhere that reduces contrast? (4) Should a neutral gray be used for "benchmark/prior year" series instead of navy, which carries brand weight? Proposed fix: replace or supplement PALETTE in `src/charts.js` and update individual chart dataset colors where best practice diverges from current choices. Affects: `src/charts.js`.

- [ ] **Tooltip audit — all charts** — review every chart's tooltip for (1) correct mode (`nearest`/`index` as appropriate), (2) content that goes beyond what's already visible on the chart (no redundant labels), and (3) enriched context where the underlying data supports it (e.g., breakdown lines, state/venue, comparison to average). Model: the VIP scatter tooltip refactor. Charts to audit: all t1, t2, t3, t4 charts. Affects: `src/charts.js` (tooltip callbacks throughout).

- [x] **VIP Scatter: color-code dots by tier** — split the single scatter dataset into four named datasets (Standard, Silver, Gold, Platinum), each with a distinct color. Lets the tier clusters read immediately without squinting at x-axis labels. Affects: `src/charts.js` (t4-vipScatter).

- [x] **VIP Scatter: add mean marker per tier** — overlay a horizontal tick or diamond at the average XCS for each tier, drawn as a separate dataset with `pointStyle: 'line'` or similar. This is the punchline: "Platinum fans average $X more than Gold." Affects: `src/charts.js` (t4-vipScatter).

- [x] **VIP Scatter: add horizontal jitter** — offset each dot slightly on the x-axis (±0.15 random per fan) so stacked points separate and density becomes visible. Affects: `src/charts.js` (t4-vipScatter, scatter data mapping).

- [x] **Top Decile: enrich fan labels** — replace "Fan #1" with `Plat • NY` (VIP tier abbreviation + home state). Makes the "who are these fans" question immediately answerable. Affects: `src/charts.js` (t4-topDecile label mapping).

- [x] **Top Decile: total value label at bar end** — show each fan's total XCS as a dollar label at the right end of their bar. Eliminates the need to estimate from the x-axis. Implement via Chart.js `afterDraw` plugin or datalabels if available. Affects: `src/charts.js` (t4-topDecile options).

- [ ] **Top Decile: average fan reference line** — add a vertical dotted line at the average XCS across all linked fans. The contrast between top decile bars and the average line is the core insight of this chart. Implement as a second dataset with a single point spanning the y-axis, or via Chart.js annotation. Affects: `src/charts.js` (t4-topDecile).

- [ ] **Add choropleth map (fan geography by state) to ADW tab and Fan Identity tab**

## Epic — Circuit Analytics (Multi-Venue Fan Tracking)

> ⚠️ **Stop and discuss before starting this epic.** Requires significant data model changes and re-work of multiple charts and BANs. Prioritize all items above this section first.

NYRA operates a seasonal circuit (Saratoga → Belmont → Aqueduct) where high-value fans follow the full season across venues. The current data model assigns each fan a single venue, making circuit followers invisible. This epic adds multi-venue attendance tracking and a new analytical lens around "circuit follower" segmentation.

**Data model changes:**
- Replace single `primary_venue` with an attendance history array per fan (venue + event count + spend per venue)
- Derive `primary_venue` as the venue with highest event attendance count
- Add `venue_count` field (1, 2, or 3) and `is_circuit_follower` flag (attends 2+ venues)
- Re-calibrate synthetic data so ~15–20% of fans are multi-venue (realistic for NYRA's engaged base)

**New tab: "Circuit Analytics"**
This content warrants its own tab rather than being folded into Fan Identity. The Fan Identity tab tells the P3RL linkage and cross-channel spend story — Circuit Analytics is a distinct narrative: here's who follows the full NYRA season, here's what they're worth, here's where you're losing them between legs. In a live demo it becomes the punchline tab — everything before it builds to "and here's what becomes possible when all of that is linked."

**New metrics (not in current scope anywhere):**
- Circuit follow rate — % of linked fans attending 2+ venues
- Circuit follower LTV vs. single-venue LTV — the core ROI number
- Venue transition funnel — Saratoga → Belmont retention rate, Belmont → Aqueduct retention rate, etc.
- Cross-venue F&B and ticket attach rates for circuit followers specifically
- Circuit follower VIP tier distribution — are your top ADW bettors also circuit followers?

**New charts/BANs for the Circuit Analytics tab:**
- BANs: Circuit Follow Rate, Avg Circuit Follower XCS vs. Single-Venue XCS, 2-Venue Fans, 3-Venue Fans
- Venue transition funnel chart (Sankey or stepped bar)
- Circuit follower vs. single-venue spend breakdown (grouped bar — ADW / Tickets / F&B)
- Circuit follower map — geographic distribution of multi-venue fans

**Updates to existing tabs:**
- Fan Identity: add "Circuit Followers (2+ Venues)" BAN as a teaser metric
- VIP scatter and Top Decile: enrich tooltips/labels with venue count

**Proposal/deck implication:** Circuit analytics is strong enough to anchor a separate section of a capabilities deck — reframes the engagement from "data integration" to "circuit intelligence capability." Unique to multi-track operators; no single-venue ADW platform can offer this view.

**Why it matters for the pitch:** Phase 1 = identity resolution within a venue. Phase 2 = circuit analytics across the full NYRA property portfolio. Direct path to cross-venue loyalty program design and a differentiated upsell from Phase 1 delivery. — add a US state-level choropleth map showing fan/patron distribution by state, similar to a blue-shaded intensity map (darker = higher concentration). Should appear on both Tab 1 (ADW) and Tab 4 (Fan Identity). Data: derive state counts from the existing patron dataset. Rendering: use a lightweight SVG-based approach (e.g., D3 or a static SVG US map with fill driven by data) since Chart.js doesn't natively support geo maps. Affects: `src/charts.js` (new renderMap helper), `src/data.js` (state aggregation), `src/shell.html` (map container in both tabs), `src/style.css` (map sizing/legend).
