# Rangers Fan Identity Demo — Backlog

## Bugs

- **March SEASONALITY index is 0** — `SEASONALITY[2] = 0` causes March games to fall back to `0.85` attendance multiplier via the `|| 0.85` guard. Should be explicit (e.g. `0.82`). Works today but is a latent bug if the fallback is ever removed.

- **Choropleth tooltip leaks on re-render** — `renderStateMap` appends a new tooltip `<div>` to `<body>` on every call without removing the prior one. Each filter interaction adds an orphaned element.

- **Beer & Wine revenue over-sums in summer** — `beer_wine_revenue` uses `0.38 + 0.03` (July uplift) while food + non_alc fractions stay fixed. Food + beer_wine + non_alc exceed `total_revenue` by ~3% in June–August. Sub-category totals won't reconcile to `total_revenue` in those months.

- **Export silently no-ops on empty results** — `downloadCSV` returns early with no user feedback if a filter combination yields zero rows. Should surface a "No data to export" notice.

## Enhancements

- **`stm_utilization` is null for dark fans** — SCAN+FNB-only fans have no ticket record, so utilization is undefined. Consider calling this out explicitly in the Tab 4 BAN tooltip or Venn tooltip to reinforce the CRM blind spot narrative.

- **`resetTab` key mapping is fragile** — uses `.replace(/^t\d-/, '')` regex to map select IDs back to STATE keys. Works for all current IDs but would silently break if ID naming diverges. Low risk for this demo.

- **Logo sizing on narrow viewports** — header logo hasn't been tested below ~900px wide. May need `max-width` constraint on smaller screens.
