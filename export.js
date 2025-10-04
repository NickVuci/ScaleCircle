// Export functionality for pitch-class circle

// Small utilities
const NS = 'http://www.w3.org/2000/svg';
const DEBUG = false; // set true to see logs
const log = (...args) => { if (DEBUG) console.log('[export]', ...args); };

// Get DOM elements used by export
function getExportDom() {
  return {
    svg: document.getElementById('svg'),
    exportFilename: document.getElementById('exportFilename'),
    exportSvgBtn: document.getElementById('exportSvgBtn'),
    exportPngBtn: document.getElementById('exportPngBtn'),
    exportJpgBtn: document.getElementById('exportJpgBtn'),
    circleSize: document.getElementById('circleSize'),
    labelSize: document.getElementById('labelSize'),
    labelDistance: document.getElementById('labelDistance'),
    showLabels: document.getElementById('showLabels'),
    showCircle: document.getElementById('showCircle'),
    showRays: document.getElementById('showRays'),
    periodInput: document.getElementById('periodInput'),
    intervalsTA: document.getElementById('intervals')
  };
}

// Filename helper
function getFilename(extension) {
  const { exportFilename } = getExportDom();
  const name = (exportFilename && exportFilename.value.trim()) || 'pitch-class-circle';
  return `${name}.${extension}`;
}

// Dimension calculation mirrors live rendering (square export)
function calculateExportDimensions() {
  const { svg, circleSize, labelDistance, showLabels } = getExportDom();
  const circleSizeValue = parseFloat(circleSize.value);
  const container = svg.parentElement;
  const rect = container.getBoundingClientRect();
  const W = Math.max(rect.width, 400);
  const H = Math.max(rect.height, 400);

  const padding = 60;
  const maxRadius = Math.min(W, H) / 2 - padding;
  const baseRadius = Math.max(20, maxRadius);
  const radius = baseRadius * circleSizeValue;

  const labelDist = showLabels.checked ? parseFloat(labelDistance?.value || 35) : 0;
  const totalRadius = radius + labelDist;

  const exportPadding = 30;
  const size = Math.max(300, Math.ceil((totalRadius + exportPadding) * 2));

  log('dimensions', { W, H, radius, labelDist, size });
  return { size, radius, cx: size / 2, cy: size / 2 };
}

// Normalize the period label: keep ratios; strip cent symbols otherwise
function normalizePeriodLabel(inputValue, periodCents) {
  const s = String(inputValue || '').trim();
  if (!s) return `${periodCents.toFixed(0)}`;
  if (s.includes('/')) return s;
  if (/^-?\d+(?:\.\d+)?(?:c|¢)?$/i.test(s)) return s.replace(/[c¢]/ig, '').trim();
  return `${periodCents.toFixed(0)}`;
}

// Build items: period at top + intervals positioned by period
function buildItems(periodInput, intervalsTA, cx, cy, radius, periodCents) {
  const items = [];
  const periodRaw = normalizePeriodLabel(periodInput.value, periodCents);
  items.push({ cents: 0, raw: periodRaw, type: 'period', deg: 0, x: cx, y: cy - radius });

  const lines = intervalsTA.value.split(/\r?\n/);
  for (const line of lines) {
    const it = parseCentsOrRatioToCents(line);
    if (!it) continue;
    const deg = ((it.cents / periodCents) * 360) % 360;
    const rad = (deg - 90) * Math.PI / 180;
    const x = cx + Math.cos(rad) * radius;
    const y = cy + Math.sin(rad) * radius;
    items.push({ ...it, deg, x, y });
  }
  return items;
}

// Create the export SVG mirroring the live style
function createExportSVG() {
  const dims = calculateExportDimensions();
  const { periodInput, intervalsTA, showCircle, showLabels, showRays, labelSize, labelDistance } = getExportDom();

  const periodCents = parsePeriodToCents(periodInput.value);
  if (!isFinite(periodCents) || periodCents === 0) {
    log('invalid period', periodCents);
    // Still return an empty white square SVG so export works gracefully
    const empty = document.createElementNS(NS, 'svg');
    empty.setAttribute('width', dims.size);
    empty.setAttribute('height', dims.size);
    empty.setAttribute('viewBox', `0 0 ${dims.size} ${dims.size}`);
    const bg = document.createElementNS(NS, 'rect');
    bg.setAttribute('x', 0); bg.setAttribute('y', 0);
    bg.setAttribute('width', dims.size); bg.setAttribute('height', dims.size);
    bg.setAttribute('fill', 'white');
    empty.appendChild(bg);
    return empty;
  }

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', dims.size);
  svg.setAttribute('height', dims.size);
  svg.setAttribute('viewBox', `0 0 ${dims.size} ${dims.size}`);
  svg.setAttribute('xmlns', NS);

  // Background
  const bg = document.createElementNS(NS, 'rect');
  bg.setAttribute('x', 0); bg.setAttribute('y', 0);
  bg.setAttribute('width', dims.size); bg.setAttribute('height', dims.size);
  bg.setAttribute('fill', 'white');
  svg.appendChild(bg);

  // Circle guide
  if (showCircle.checked) {
    const circle = document.createElementNS(NS, 'circle');
    circle.setAttribute('cx', dims.cx);
    circle.setAttribute('cy', dims.cy);
    circle.setAttribute('r', dims.radius);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', 'black');
    circle.setAttribute('stroke-width', '1');
    svg.appendChild(circle);
  }

  const items = buildItems(periodInput, intervalsTA, dims.cx, dims.cy, dims.radius, periodCents);

  // Rays
  if (showRays.checked) {
    for (const d of items) {
      const a = (d.deg - 90) * Math.PI / 180;
      const x2 = dims.cx + Math.cos(a) * dims.radius;
      const y2 = dims.cy + Math.sin(a) * dims.radius;
      const ray = document.createElementNS(NS, 'line');
      ray.setAttribute('x1', dims.cx);
      ray.setAttribute('y1', dims.cy);
      ray.setAttribute('x2', x2);
      ray.setAttribute('y2', y2);
      ray.setAttribute('stroke', 'black');
      ray.setAttribute('stroke-width', '1');
      svg.appendChild(ray);
    }
  }

  // Points and labels
  for (const d of items) {
    const g = document.createElementNS(NS, 'g');

    const pt = document.createElementNS(NS, 'circle');
    pt.setAttribute('cx', d.x);
    pt.setAttribute('cy', d.y);
    pt.setAttribute('r', 5.2);
    pt.setAttribute('fill', 'black');
    pt.setAttribute('stroke', 'none');
    g.appendChild(pt);

    if (showLabels.checked) {
      const label = document.createElementNS(NS, 'text');
      const labelCircleRadius = dims.radius + parseFloat(labelDistance?.value || 35);
      const rad = (d.deg - 90) * Math.PI / 180;
      const lx = dims.cx + Math.cos(rad) * labelCircleRadius;
      const ly = dims.cy + Math.sin(rad) * labelCircleRadius;
      label.setAttribute('x', lx);
      label.setAttribute('y', ly);
      label.setAttribute('fill', 'black');
      label.setAttribute('font-size', labelSize.value);
      label.setAttribute('dominant-baseline', 'middle');
      label.setAttribute('text-anchor', 'middle');
      label.textContent = d.raw;
      g.appendChild(label);
    }

    svg.appendChild(g);
  }

  return svg;
}

// Export as SVG
function handleSvgExport() {
  const exportSvg = createExportSVG();
  const serializer = new XMLSerializer();
  const str = serializer.serializeToString(exportSvg);
  const blob = new Blob([str], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = getFilename('svg');
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

// Export as raster image (PNG/JPG)
function handleRasterExport(format) {
  const exportSvg = createExportSVG();
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(exportSvg);

  const squareSize = parseInt(exportSvg.getAttribute('width'));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  const scale = 2; // high DPI
  canvas.width = squareSize * scale;
  canvas.height = squareSize * scale;

  img.onload = function () {
    if (format === 'jpg') {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, squareSize, squareSize);

    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    canvas.toBlob(function (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = getFilename(format);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 500);
    }, mimeType, 0.95);
  };

  img.onerror = function (e) {
    console.error('[export] Image loading failed:', e);
  };

  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  img.src = svgUrl;
}

// Wire up export buttons after DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const { exportSvgBtn, exportPngBtn, exportJpgBtn } = getExportDom();
  if (exportSvgBtn) exportSvgBtn.addEventListener('click', handleSvgExport);
  if (exportPngBtn) exportPngBtn.addEventListener('click', () => handleRasterExport('png'));
  if (exportJpgBtn) exportJpgBtn.addEventListener('click', () => handleRasterExport('jpg'));
});