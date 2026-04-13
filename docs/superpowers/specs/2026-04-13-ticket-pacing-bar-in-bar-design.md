# Ticket Pacing — Bar-in-Bar Visualization Design Spec

**Date:** 2026-04-13
**Project:** Texas Rangers Fan Identity Demo
**Feature:** Replace annotation lines in `t2-ticketPacing` with a bar-in-bar visualization

---

## Overview

The current Ticket Pacing chart shows per-game ticket sold percentages as horizontal bars, with two static dashed annotation lines at 70% and 88% marking the Day 4 and Day 17 benchmarks. The 88% day-of threshold is computed per game but never rendered visually.

This spec replaces the annotation lines with a bar-in-bar approach: a light gray background rectangle rendered behind each bar, extending to that game's specific target. The gap (or overshoot) between the colored bar and the gray box is instantly readable without requiring the viewer to locate a floating reference line. All three thresholds (70%, 78%, 88%) are now visible simultaneously — one per game — rather than two static global lines.

---

## Data

No changes to `data.js`. `UPCOMING_PACING` is unchanged. The existing per-game target computation in `charts.js` is unchanged:

```js
const target = d.daysUntil >= 17 ? 78 : d.daysUntil >= 4 ? 70 : 88;
```

`target` is already stored in each `upcomingPacing` entry and drives the background rectangle width.

---

## Implementation: `beforeDatasetsDraw` Plugin

A new plugin `barInBarPlugin` is added to the chart's `plugins` array alongside the existing `pacingLabelPlugin`. It runs in the `beforeDatasetsDraw` hook so the target rectangles render behind the pctSold bars.

**Per-bar drawing logic:**

```js
const barInBarPlugin = {
  id: 't2PacingTarget',
  beforeDatasetsDraw(chart) {
    const { ctx, scales } = chart;
    const meta = chart.getDatasetMeta(0);
    meta.data.forEach((bar, i) => {
      const target = upcomingPacing[i].target;
      const x0 = scales.x.getPixelForValue(0);
      const xT = scales.x.getPixelForValue(target);
      const halfH = bar.height / 2;
      ctx.save();
      // Background fill
      ctx.fillStyle = 'rgba(0,0,0,0.07)';
      ctx.fillRect(x0, bar.y - halfH, xT - x0, bar.height);
      // Target edge tick
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(xT, bar.y - halfH);
      ctx.lineTo(xT, bar.y + halfH);
      ctx.stroke();
      ctx.restore();
    });
  },
};
```

**Visual spec:**
- Target rectangle fill: `rgba(0,0,0,0.07)` — neutral gray, does not compete with bar colors
- Target edge line: `rgba(0,0,0,0.25)`, 1.5px — crisp boundary even when pctSold ≈ target
- Rectangle height: `bar.height` (matches pctSold bar exactly)
- Rectangle y: centered on `bar.y` (same center as pctSold bar)
- Rectangle x: from `scales.x.getPixelForValue(0)` to `scales.x.getPixelForValue(target)`

---

## What Is Removed

| Item | Action |
|------|--------|
| `floor70` annotation | Deleted |
| `target78` annotation | Deleted |
| `annotation: { annotations: { ... } }` options block | Deleted entirely (no remaining annotations on this chart) |

The `chartjs-plugin-annotation` CDN script in `shell.html` is still used by other charts — do not remove it.

---

## What Is Unchanged

| Item | Status |
|------|--------|
| `pacingLabelPlugin` (inline `pctSold%` labels) | Unchanged |
| Bar colors (blue/gray/red by gap) | Unchanged |
| Tooltip callback | Unchanged |
| x-axis range (`min: 0, max: 100`) | Unchanged |
| `UPCOMING_PACING` data | Unchanged |
| Target computation logic | Unchanged |

---

## ⓘ Tooltip Update (`shell.html`)

The chart title's `data-tooltip` attribute references the old annotation lines and must be rewritten.

**Current:**
```
Next 12 games from mid-season reference (Jul 14, 2025).
Color: blue = on/above target · gray = within 10 pts · red = at risk.
Dashed benchmark lines:
  Gray (70%) — Day 4 single-game floor
  Blue (78%) — Day 17 total budget target
Hover a bar for exact gap and status.
```

**Replacement:**
```
Next 12 games from mid-season reference (Jul 14, 2025).
Color: blue = on/above target · gray = within 10 pts · red = at risk.
Gray box = per-game target (70% at Day 4 · 78% at Day 17 · 88% day-of).
Bar past the box = ahead of target. Gap between bar and box = behind target.
Hover a bar for exact gap and status.
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/charts.js` | Add `barInBarPlugin`; remove `annotation` options block from `t2-ticketPacing` |
| `src/shell.html` | Rewrite `data-tooltip` on the Ticket Pacing chart title |
