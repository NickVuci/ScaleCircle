// Export functionality for pitch-class circle

// Debug flag - set to true to enable detailed logging
const DEBUG = false;
const log = (...args) => { if (DEBUG) console.log('[export]', ...args); };

/**
 * Get all DOM elements used by export functionality
 * @returns {Object} Object containing references to all required DOM elements
 */
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

/**
 * Get filename with extension for export
 * @param {string} extension - File extension (svg, png, jpg)
 * @returns {string} Filename with extension
 */
function getFilename(extension) {
  const { exportFilename } = getExportDom();
  const name = (exportFilename && exportFilename.value.trim()) || 'pitch-class-circle';
  return `${name}.${extension}`;
}

/**
 * Calculate square dimensions for export (fits circle + labels + padding)
 * @returns {{size: number, radius: number, cx: number, cy: number}}
 */
function calculateExportDimensions() {
  const { svg, circleSize, labelDistance, showLabels } = getExportDom();
  const circleSizeValue = parseFloat(circleSize.value);
  
  const container = svg.parentElement;
  const rect = container.getBoundingClientRect();
  const dims = calculateDimensions(rect, circleSizeValue);

  const labelDist = showLabels.checked ? parseFloat(labelDistance?.value || DEFAULTS.LABEL_DISTANCE) : 0;
  const totalRadius = dims.radius + labelDist;
  const size = Math.max(DEFAULTS.EXPORT_MIN_SIZE, Math.ceil((totalRadius + DEFAULTS.EXPORT_PADDING) * 2));

  log('export dimensions', { size, radius: dims.radius, labelDist });
  return { size, radius: dims.radius, cx: size / 2, cy: size / 2 };
}


/**
 * Create SVG element for export with all diagram elements
 * @returns {SVGElement} Complete SVG ready for export
 */
function createExportSVG() {
  const dims = calculateExportDimensions();
  const { periodInput, intervalsTA, showCircle, showLabels, showRays, labelSize, labelDistance } = getExportDom();

  const periodCents = parsePeriodToCents(periodInput.value);
  if (!isFinite(periodCents) || periodCents === 0) {
    log('invalid period', periodCents);
    // Return empty white square SVG for graceful degradation
    const empty = createSVGElement('svg', { width: dims.size, height: dims.size, viewBox: `0 0 ${dims.size} ${dims.size}` });
    const bg = createSVGElement('rect', { x: 0, y: 0, width: dims.size, height: dims.size, fill: 'white' });
    empty.appendChild(bg);
    return empty;
  }

  const svg = createSVGElement('svg', {
    width: dims.size,
    height: dims.size,
    viewBox: `0 0 ${dims.size} ${dims.size}`,
    xmlns: SVG_NS
  });

  // Background
  const bg = createSVGElement('rect', { x: 0, y: 0, width: dims.size, height: dims.size, fill: 'white' });
  svg.appendChild(bg);

  // Circle guide
  if (showCircle.checked) {
    const circle = createSVGElement('circle', {
      cx: dims.cx,
      cy: dims.cy,
      r: dims.radius,
      fill: 'none',
      stroke: 'black',
      'stroke-width': 1
    });
    svg.appendChild(circle);
  }

  // Build items
  const items = buildItems(periodInput.value, intervalsTA.value, dims.cx, dims.cy, dims.radius, periodCents);
  log('items', items.length);

  // Rays
  if (showRays.checked) {
    for (const item of items) {
      const angle = (item.deg - 90) * Math.PI / 180;
      const x2 = dims.cx + Math.cos(angle) * dims.radius;
      const y2 = dims.cy + Math.sin(angle) * dims.radius;
      const ray = createSVGElement('line', {
        x1: dims.cx,
        y1: dims.cy,
        x2,
        y2,
        stroke: 'black',
        'stroke-width': 1
      });
      svg.appendChild(ray);
    }
  }

  // Points and labels
  const labelDist = parseFloat(labelDistance?.value || DEFAULTS.LABEL_DISTANCE);
  const labelRadius = dims.radius + labelDist;
  
  for (const item of items) {
    const g = createSVGElement('g');

    const pt = createSVGElement('circle', {
      cx: item.x,
      cy: item.y,
      r: DEFAULTS.POINT_RADIUS,
      fill: 'black',
      stroke: 'none'
    });
    g.appendChild(pt);

    if (showLabels.checked) {
      const angle = (item.deg - 90) * Math.PI / 180;
      const lx = dims.cx + Math.cos(angle) * labelRadius;
      const ly = dims.cy + Math.sin(angle) * labelRadius;
      
      const label = createSVGElement('text', {
        x: lx,
        y: ly,
        fill: 'black',
        'font-size': labelSize.value,
        'dominant-baseline': 'middle',
        'text-anchor': 'middle'
      });
      label.textContent = item.raw;
      g.appendChild(label);
    }

    svg.appendChild(g);
  }

  log('final export size', dims.size + 'x' + dims.size);
  return svg;
}

/**
 * Handle SVG export - creates and downloads SVG file
 */
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

/**
 * Handle raster image export (PNG or JPG)
 * @param {string} format - Export format ('png' or 'jpg')
 */
function handleRasterExport(format) {
  const exportSvg = createExportSVG();
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(exportSvg);

  const squareSize = parseInt(exportSvg.getAttribute('width'));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  canvas.width = squareSize * DEFAULTS.EXPORT_SCALE;
  canvas.height = squareSize * DEFAULTS.EXPORT_SCALE;
  log('canvas', canvas.width + 'x' + canvas.height);

  img.onload = function () {
    if (format === 'jpg') {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.scale(DEFAULTS.EXPORT_SCALE, DEFAULTS.EXPORT_SCALE);
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
      log(format.toUpperCase() + ' export complete');
    }, mimeType, 0.95);
  };

  img.onerror = function (e) {
    console.error('[export] Image loading failed:', e);
  };

  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  img.src = svgUrl;
}

/**
 * Wire up export button event listeners after DOM is ready
 */
window.addEventListener('DOMContentLoaded', () => {
  const { exportSvgBtn, exportPngBtn, exportJpgBtn } = getExportDom();
  if (exportSvgBtn) exportSvgBtn.addEventListener('click', handleSvgExport);
  if (exportPngBtn) exportPngBtn.addEventListener('click', () => handleRasterExport('png'));
  if (exportJpgBtn) exportJpgBtn.addEventListener('click', () => handleRasterExport('jpg'));
});