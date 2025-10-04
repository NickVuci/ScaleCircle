// DOM elements
const svg = document.getElementById('svg');
const periodInput = document.getElementById('periodInput');
const intervalsTA = document.getElementById('intervals');
const showCircle = document.getElementById('showCircle');
const showRays = document.getElementById('showRays');
const showLabels = document.getElementById('showLabels');
const circleSize = document.getElementById('circleSize');
const labelSize = document.getElementById('labelSize');
const labelDistance = document.getElementById('labelDistance');
const periodInfo = document.getElementById('periodInfo');

// ---------- Math helpers ----------
const log2 = x => Math.log(x) / Math.LN2;

function parseRatio(str) {
  // Accept formats: a/b, decimal like 1.5, or with spaces
  const s = String(str).trim();
  if (!s) return null;
  if (s.includes('/')) {
    const [a, b] = s.split('/').map(Number);
    if (isFinite(a) && isFinite(b) && b !== 0) return a / b;
    return null;
  }
  const n = Number(s);
  if (isFinite(n) && n > 0) return n; // decimal ratio like 1.25
  return null;
}

function parseCentsOrRatioToCents(token) {
  // returns { cents: number, raw: string, type: 'cents'|'ratio' }
  const raw = String(token).trim();
  if (!raw || raw.startsWith('#')) return null;
  // Allow trailing 'c' or '¢'
  const centsLike = raw.replace(/\s/g,'');
  if (/^-?\d+(?:\.\d+)?(?:c|¢)?$/i.test(centsLike)) {
    const n = Number(centsLike.replace(/[c¢]/ig, ''));
    if (isFinite(n)) return { cents: n, raw, type: 'cents' };
  }
  // Try ratio
  const r = parseRatio(raw);
  if (r != null) {
    const cents = 1200 * log2(r);
    return { cents, raw, type: 'ratio' };
  }
  return null;
}

function parsePeriodToCents(str) {
  const s = String(str || '').trim();
  if (!s) return NaN;
  // If looks like a number with optional 'c' treat as cents
  if (/^-?\d+(?:\.\d+)?(?:c|¢)?$/i.test(s)) {
    return Number(s.replace(/[c¢]/ig, ''));
  }
  // Try ratio
  const r = parseRatio(s);
  if (r != null) return 1200 * log2(r);
  return NaN;
}

// ---------- Drawing ----------
function clearSVG() { 
  while (svg.firstChild) svg.removeChild(svg.firstChild); 
}

function draw() {
  clearSVG();
  
  // Get container dimensions and ensure they're consistent
  const container = svg.parentElement;
  const containerRect = container.getBoundingClientRect();
  const W = Math.max(containerRect.width, 400);
  const H = Math.max(containerRect.height, 400);
  
  // Set fixed dimensions to prevent layout shifts
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  
  // Add invisible background to stabilize the SVG bounds
  const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  background.setAttribute('x', '0');
  background.setAttribute('y', '0');
  background.setAttribute('width', W);
  background.setAttribute('height', H);
  background.setAttribute('fill', 'white');
  background.setAttribute('stroke', 'none');
  svg.appendChild(background);
  
  const cx = W/2, cy = H/2;
  // Ensure circle fits with padding for labels and elements outside the circle
  const padding = 60; // Space for labels and tick marks
  const maxRadius = Math.min(W, H) / 2 - padding;
  const baseRadius = Math.max(20, maxRadius); // Minimum radius of 20px
  const radius = baseRadius * parseFloat(circleSize.value); // Apply user size setting

  const periodCents = parsePeriodToCents(periodInput.value);
  periodInfo.textContent = isFinite(periodCents) ? `Period: ${periodCents.toFixed(3)}¢` : 'Period: —';
  if (!isFinite(periodCents) || periodCents === 0) return;

  // Background polar grid (optional circle)
  if (showCircle.checked) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx); 
    circle.setAttribute('cy', cy); 
    circle.setAttribute('r', radius);
    circle.setAttribute('fill', 'none'); 
    circle.setAttribute('stroke', 'black'); 
    circle.setAttribute('stroke-width', '1');
    svg.appendChild(circle);

    // Note: Removed tick marks and degree labels for cleaner appearance
  }

  // Parse intervals
  const lines = intervalsTA.value.split(/\r?\n/);
  const items = [];
  
  // Determine the original format of the period input
  const periodInputValue = periodInput.value.trim();
  let periodDisplayValue;
  
  // Check if period was entered as a ratio
  if (periodInputValue.includes('/')) {
    periodDisplayValue = periodInputValue; // Keep the ratio format
  } else if (/^-?\d+(?:\.\d+)?(?:c|¢)?$/i.test(periodInputValue)) {
    // Period was entered as cents, preserve the format
    periodDisplayValue = periodInputValue.includes('c') || periodInputValue.includes('¢') 
      ? periodInputValue 
      : `${periodInputValue}¢`;
  } else {
    // Fallback to cents if format is unclear
    periodDisplayValue = `${periodCents.toFixed(0)}¢`;
  }
  
  // Add the period as the first item (at 0 degrees)
  items.push({
    cents: 0,
    raw: periodDisplayValue,
    type: 'period',
    deg: 0,
    x: cx,
    y: cy - radius
  });
  
  for (const line of lines) {
    const it = parseCentsOrRatioToCents(line);
    if (!it) continue;
    // Degrees modulo 360
    const deg = ((it.cents / periodCents) * 360) % 360;
    const theta = (deg - 90) * Math.PI / 180; // put 0° at top
    const x = cx + Math.cos(theta) * radius;
    const y = cy + Math.sin(theta) * radius;
    items.push({ ...it, deg, x, y });
  }

  // Rays (optional)
  if (showRays.checked) {
    for (const d of items) {
      const a = (d.deg - 90) * Math.PI / 180;
      const x2 = cx + Math.cos(a) * radius;
      const y2 = cy + Math.sin(a) * radius;
      const ray = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      ray.setAttribute('x1', cx); 
      ray.setAttribute('y1', cy); 
      ray.setAttribute('x2', x2); 
      ray.setAttribute('y2', y2);
      ray.setAttribute('stroke', 'black'); 
      ray.setAttribute('stroke-width', '1');
      svg.appendChild(ray);
    }
  }

  // Points & labels
  for (const d of items) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    // point
    const pt = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pt.setAttribute('cx', d.x); 
    pt.setAttribute('cy', d.y); 
    pt.setAttribute('r', 5.2);
    pt.setAttribute('fill', 'black');
    pt.setAttribute('stroke', 'none');
    g.appendChild(pt);

    if (showLabels.checked) {
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  // Position labels on a larger concentric circle for better spacing
  const dist = parseFloat(labelDistance?.value || 35);
  const labelCircleRadius = radius + dist; // Labels on an even larger circle than degree markers
      const rad = (d.deg - 90) * Math.PI / 180; // Same angle transformation as points
      const lx = cx + Math.cos(rad) * labelCircleRadius;
      const ly = cy + Math.sin(rad) * labelCircleRadius;
  label.setAttribute('x', lx);
  label.setAttribute('y', ly);
  label.setAttribute('fill', 'black');
  label.setAttribute('font-size', labelSize.value); // Use user-controlled label size
  // Center the label on the label radius so its midpoint lies on the radial line
  label.setAttribute('dominant-baseline', 'middle');
  label.setAttribute('text-anchor', 'middle');
      // Show only the original interval value (cents or ratio)
      label.textContent = d.raw;
      g.appendChild(label);
    }
    svg.appendChild(g);
  }
}

// ---------- Event listeners ----------
const inputs = [periodInput, intervalsTA, showCircle, showRays, showLabels, circleSize, labelSize, labelDistance];
inputs.forEach(el => el.addEventListener('input', draw));

window.addEventListener('resize', draw);

// Initial draw
draw();