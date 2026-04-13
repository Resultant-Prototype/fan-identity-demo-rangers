# Ticket Pacing Bar-in-Bar Visualization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two static annotation lines on the Ticket Pacing chart with a per-game background rectangle that extends to each game's dynamic target, making the gap or overshoot instantly readable at a glance.

**Architecture:** A `beforeDatasetsDraw` plugin (`barInBarPlugin`) draws a light gray target rectangle behind each horizontal bar using `scales.x.getPixelForValue(target)` to position the right edge. The existing `pacingLabelPlugin` and all bar colors/tooltip logic are untouched. The annotation plugin options block is deleted.

**Tech Stack:** Vanilla JS, Chart.js 4.x CDN. Build: `node build.js` → `index.html`. No new dependencies.

---

## File Map

| File | Change |
|------|--------|
| `src/charts.js` | Add `barInBarPlugin` definition (~line 706); add to `plugins` array (line 708); remove `annotation` options block (~lines 730–749) |
| `src/shell.html` | Rewrite `data-tooltip` on Ticket Pacing chart title (line 164) |
| `BACKLOG.md` | Mark the bar-in-bar feature item complete |

---

## Task 1: Update the ⓘ tooltip in `src/shell.html`

**Files:**
- Modify: `src/shell.html` (line 164)

- [ ] **Step 1: Replace the tooltip attribute**

Find:
```html
<div class="chart-title">Ticket Pacing — Upcoming Games vs. Target <span class="chart-info-icon" data-tooltip="Next 12 games from mid-season reference (Jul 14, 2025).&#10;Color: blue = on/above target · gray = within 10 pts · red = at risk.&#10;Dashed benchmark lines:&#10;  Gray (70%) — Day 4 single-game floor&#10;  Blue (78%) — Day 17 total budget target&#10;Hover a bar for exact gap and status.">ⓘ</span></div>
```

Replace with:
```html
<div class="chart-title">Ticket Pacing — Upcoming Games vs. Target <span class="chart-info-icon" data-tooltip="Next 12 games from mid-season reference (Jul 14, 2025).&#10;Color: blue = on/above target · gray = within 10 pts · red = at risk.&#10;Gray box = per-game target (70% at Day 4 · 78% at Day 17 · 88% day-of).&#10;Bar past the box = ahead of target. Gap between bar and box = behind target.&#10;Hover a bar for exact gap and status.">ⓘ</span></div>
```

Changes: removes the "Dashed benchmark lines" paragraph; adds two sentences describing the gray box and how to read overshoot vs. gap.

- [ ] **Step 2: Build and verify**

```bash
cd /Users/bvinson/AnthMCP/07_Experiments/fan-identity-demo-rangers
node build.js
```

Expected: `Built index.html (XXX.X KB)` with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/shell.html
git commit -m "feat: update ticket pacing tooltip for bar-in-bar approach"
```

---

## Task 2: Add `barInBarPlugin` and remove annotation block in `src/charts.js`

**Files:**
- Modify: `src/charts.js` (~lines 706–749)

**Context:** The Ticket Pacing chart block starts at line 669 (`// ── Chart 5.5`). `pacingLabelPlugin` is defined just before the `new Chart(...)` call. The annotation block (`floor70`, `target78`) lives inside `options.plugins`. `upcomingPacing` is the array of `{ label, pctSold, target, gap, color, opponent, date, daysUntil }` objects computed at line 671 — `barInBarPlugin` accesses it via closure, the same pattern `pacingLabelPlugin` already uses.

**Important:** `shell.html` loads `chartjs-plugin-annotation` via CDN (used by other tabs). Do NOT remove that `<script>` tag — only the `annotation:` options block inside `t2-ticketPacing` is being deleted.

- [ ] **Step 1: Add `barInBarPlugin` and update the plugins array**

Find:
```js
  CHARTS['t2-ticketPacing'] = new Chart(document.getElementById('t2-ticketPacing'), {
    type: 'bar',
    plugins: [pacingLabelPlugin],
```

Replace with:
```js
  const barInBarPlugin = {
    id: 't2PacingTarget',
    beforeDatasetsDraw(chart) {
      const { ctx, scales } = chart;
      const meta = chart.getDatasetMeta(0);
      meta.data.forEach((bar, i) => {
        const target = upcomingPacing[i].target;
        const x0   = scales.x.getPixelForValue(0);
        const xT   = scales.x.getPixelForValue(target);
        const halfH = bar.height / 2;
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.07)';
        ctx.fillRect(x0, bar.y - halfH, xT - x0, bar.height);
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

  CHARTS['t2-ticketPacing'] = new Chart(document.getElementById('t2-ticketPacing'), {
    type: 'bar',
    plugins: [barInBarPlugin, pacingLabelPlugin],
```

- [ ] **Step 2: Remove the annotation block**

Find:
```js
        annotation: {
          annotations: {
            floor70: {
              type: 'line', scaleID: 'x', value: 70,
              borderColor: '#8B96A5', borderWidth: 1.5, borderDash: [4, 3],
              label: { display: true, content: 'Day 4 floor (70%)', position: 'end',
                       font: { size: 9 }, color: '#8B96A5',
                       backgroundColor: 'rgba(255,255,255,0.85)', padding: { x: 3, y: 2 } },
            },
            target78: {
              type: 'line', scaleID: 'x', value: 78,
              borderColor: '#4A7FC1', borderWidth: 1.5, borderDash: [4, 3],
              label: { display: true, content: 'Day 17 target (78%)', position: 'end',
                       font: { size: 9 }, color: '#4A7FC1',
                       backgroundColor: 'rgba(255,255,255,0.85)', padding: { x: 3, y: 2 } },
            },
          },
        },
```

Replace with: *(nothing — delete this block entirely)*

- [ ] **Step 3: Build and verify**

```bash
node build.js
```

Expected: clean output, no errors.

- [ ] **Step 4: Commit**

```bash
git add src/charts.js
git commit -m "feat: add bar-in-bar target plugin to ticket pacing chart, remove annotation lines"
```

---

## Task 3: Update BACKLOG.md, final build, commit, and push

**Files:**
- Modify: `BACKLOG.md`
- Regenerate: `index.html`

- [ ] **Step 1: Mark the backlog item complete**

In `BACKLOG.md`, find:
```markdown
- **Ticket Pacing: bar-in-bar visualization** — Replace the current annotation-line approach (dashed lines at 70% and 78%) with a bar-in-bar chart where the outer bar represents the dynamic per-game target (based on days-out: 88% day-of, 70% at Day 4, 78% at Day 17) and the inner bar shows actual % sold. The gap or overhang between them is instantly readable without requiring the viewer to find a floating reference line. Implementation: render two datasets — a background bar at `target` opacity and a foreground bar at `pctSold`, both on the same y-axis. Replaces `floor70` and `target78` annotations in `t2-ticketPacing`.
```

Replace with:
```markdown
~~- **Ticket Pacing: bar-in-bar visualization**~~ ✓ Fixed — `barInBarPlugin` (`beforeDatasetsDraw`) draws a light gray target rectangle behind each pctSold bar. Right edge of the rectangle marks the per-game target (88% day-of · 70% at Day 4 · 78% at Day 17). Annotation lines removed. Bar past the box = ahead of target; gap visible = behind target.
```

- [ ] **Step 2: Final build**

```bash
node build.js
```

Expected: clean output, no assertion failures.

- [ ] **Step 3: Commit and push**

```bash
git add BACKLOG.md index.html
git commit -m "feat: ticket pacing bar-in-bar complete — dynamic target boxes replace annotation lines"
git push
```
