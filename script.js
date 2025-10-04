// Live diagram rendering for pitch-class circle

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

/**
 * Clear all child elements from the SVG
 */
function clearSVG() { 
  while (svg.firstChild) svg.removeChild(svg.firstChild); 
}

/**
 * Draw white background rectangle
 */
function drawBackground(W, H) {
  const bg = createSVGElement('rect', {
    x: 0,
    y: 0,
    width: W,
    height: H,
    fill: 'white',
    stroke: 'none'
  });
  svg.appendChild(bg);
}

/**
 * Draw the circle guide
 */
function drawCircle(cx, cy, radius) {
  const circle = createSVGElement('circle', {
    cx,
    cy,
    r: radius,
    fill: 'none',
    stroke: 'black',
    'stroke-width': 1
  });
  svg.appendChild(circle);
}

/**
 * Draw radial lines from center to each item
 */
function drawRays(items, cx, cy, radius) {
  for (const item of items) {
    const angle = (item.deg - 90) * Math.PI / 180;
    const x2 = cx + Math.cos(angle) * radius;
    const y2 = cy + Math.sin(angle) * radius;
    
    const ray = createSVGElement('line', {
      x1: cx,
      y1: cy,
      x2,
      y2,
      stroke: 'black',
      'stroke-width': 1
    });
    svg.appendChild(ray);
  }
}

/**
 * Draw points and their labels
 */
function drawPointsAndLabels(items, cx, cy, radius) {
  const labelDist = parseFloat(labelDistance?.value || DEFAULTS.LABEL_DISTANCE);
  const labelRadius = radius + labelDist;
  const fontSize = labelSize.value;
  const showLabelsEnabled = showLabels.checked;
  
  for (const item of items) {
    const g = createSVGElement('g');
    
    // Draw point
    const pt = createSVGElement('circle', {
      cx: item.x,
      cy: item.y,
      r: DEFAULTS.POINT_RADIUS,
      fill: 'black',
      stroke: 'none'
    });
    g.appendChild(pt);
    
    // Draw label if enabled
    if (showLabelsEnabled) {
      const angle = (item.deg - 90) * Math.PI / 180;
      const lx = cx + Math.cos(angle) * labelRadius;
      const ly = cy + Math.sin(angle) * labelRadius;
      
      const label = createSVGElement('text', {
        x: lx,
        y: ly,
        fill: 'black',
        'font-size': fontSize,
        'dominant-baseline': 'middle',
        'text-anchor': 'middle'
      });
      label.textContent = item.raw;
      g.appendChild(label);
    }
    
    svg.appendChild(g);
  }
}

/**
 * Main draw function - renders the pitch-class circle diagram
 */
function draw() {
  clearSVG();
  
  // Calculate dimensions
  const container = svg.parentElement;
  const containerRect = container.getBoundingClientRect();
  const dims = calculateDimensions(containerRect, parseFloat(circleSize.value));
  
  // Set SVG dimensions to prevent layout shifts
  svg.setAttribute('width', dims.W);
  svg.setAttribute('height', dims.H);
  svg.setAttribute('viewBox', `0 0 ${dims.W} ${dims.H}`);
  
  // Draw background
  drawBackground(dims.W, dims.H);
  
  // Parse period
  const periodCents = parsePeriodToCents(periodInput.value);
  if (periodInfo) {
    periodInfo.textContent = isFinite(periodCents) 
      ? `Period: ${periodCents.toFixed(3)}¢` 
      : 'Period: —';
  }
  
  if (!isFinite(periodCents) || periodCents === 0) return;
  
  // Draw circle guide if enabled
  if (showCircle.checked) {
    drawCircle(dims.cx, dims.cy, dims.radius);
  }
  
  // Build items (period + intervals)
  const items = buildItems(
    periodInput.value,
    intervalsTA.value,
    dims.cx,
    dims.cy,
    dims.radius,
    periodCents
  );
  
  // Draw rays if enabled
  if (showRays.checked) {
    drawRays(items, dims.cx, dims.cy, dims.radius);
  }
  
  // Draw points and labels
  drawPointsAndLabels(items, dims.cx, dims.cy, dims.radius);
}


// ---------- Event listeners ----------
const inputs = [periodInput, intervalsTA, showCircle, showRays, showLabels, circleSize, labelSize, labelDistance];
inputs.forEach(el => el.addEventListener('input', draw));

window.addEventListener('resize', draw);

// Initial draw
draw();