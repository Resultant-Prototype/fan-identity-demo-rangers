#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const OUT = path.join(__dirname, 'fan-identity-demo.html');

const shell  = fs.readFileSync(path.join(SRC, 'shell.html'),   'utf8');
const style  = fs.readFileSync(path.join(SRC, 'style.css'),    'utf8');

// JS files concatenated in dependency order
const jsFiles = ['data.js', 'filters.js', 'charts.js', 'export.js', 'main.js'];
const script = jsFiles
  .map(f => `// ── ${f} ──\n` + fs.readFileSync(path.join(SRC, f), 'utf8'))
  .join('\n\n');

const output = shell
  .replace('{{STYLE}}', style)
  .replace('{{SCRIPT}}', script);

fs.writeFileSync(OUT, output, 'utf8');
console.log(`Built ${OUT} (${(output.length / 1024).toFixed(1)} KB)`);
