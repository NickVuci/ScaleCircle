// Export functionality for pitch-class circle

// Helper to safely get DOM elements used by export
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

// Helper function to get filename with extension
function getFilename(extension) {
  const { exportFilename } = getExportDom();
  const name = (exportFilename && exportFilename.value.trim()) || 'pitch-class-circle';
  return `${name}.${extension}`;
}

// Calculate the actual dimensions needed for the export
function calculateExportDimensions() {
  console.log('=== Calculating Export Dimensions ===');
  
  // Get current settings
  const { svg, circleSize, labelSize, labelDistance, showLabels, showCircle, showRays } = getExportDom();
  const circleSizeValue = parseFloat(circleSize.value);
  const labelSizeValue = parseInt(labelSize.value);
  const showLabelsEnabled = showLabels.checked;
  const showCircleEnabled = showCircle.checked;
  const showRaysEnabled = showRays.checked;
  
  console.log('Current settings:', {
    circleSize: circleSizeValue,
    labelSize: labelSizeValue,
    showLabels: showLabelsEnabled,
    showCircle: showCircleEnabled,
    showRays: showRaysEnabled
  });
  
  // Calculate the actual radius being used
  const container = svg.parentElement;
  const containerRect = container.getBoundingClientRect();
  const W = Math.max(containerRect.width, 400);
  const H = Math.max(containerRect.height, 400);
  
  console.log('Container dimensions:', { W, H });
  
  const padding = 60;
  const maxRadius = Math.min(W, H) / 2 - padding;
  const baseRadius = Math.max(20, maxRadius);
  const actualRadius = baseRadius * circleSizeValue;
  
  console.log('Radius calculation:', {
    maxRadius,
    baseRadius,
    actualRadius,
    circleMultiplier: circleSizeValue
  });
  
  // Calculate the space needed for labels
  const labelDistValue = showLabelsEnabled ? parseFloat(labelDistance?.value || 35) : 0;
  const totalRadius = actualRadius + labelDistValue;
  
  // Add some padding around everything
  const exportPadding = 30;
  const requiredDimension = (totalRadius + exportPadding) * 2;
  const finalSize = Math.max(300, Math.ceil(requiredDimension)); // Minimum 300px
  
  console.log('Final size calculation:', {
  labelDistance: labelDistValue,
    totalRadius,
    exportPadding,
    requiredDimension,
    finalSize
  });
  
  return {
    size: finalSize,
    radius: actualRadius,
    centerX: finalSize / 2,
    centerY: finalSize / 2
  };
}

// Create the export SVG with proper dimensions
function createExportSVG() {
  console.log('=== Creating Export SVG ===');
  
  const dimensions = calculateExportDimensions();
  console.log('Using dimensions:', dimensions);
  
  // Create new SVG element
  const exportSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  exportSvg.setAttribute('width', dimensions.size);
  exportSvg.setAttribute('height', dimensions.size);
  exportSvg.setAttribute('viewBox', `0 0 ${dimensions.size} ${dimensions.size}`);
  exportSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  
  // Add white background
  const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  background.setAttribute('x', '0');
  background.setAttribute('y', '0');
  background.setAttribute('width', dimensions.size);
  background.setAttribute('height', dimensions.size);
  background.setAttribute('fill', 'white');
  exportSvg.appendChild(background);
  
  // Get period data
  const { periodInput, intervalsTA, showCircle, showLabels, showRays, labelSize, labelDistance } = getExportDom();
  const periodCents = parsePeriodToCents(periodInput.value);
  if (!isFinite(periodCents) || periodCents === 0) {
    console.warn('Invalid period:', periodCents);
    return exportSvg;
  }
  
  console.log('Period:', periodCents);
  
  // Draw circle guide if enabled
  if (showCircle.checked) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', dimensions.centerX);
    circle.setAttribute('cy', dimensions.centerY);
    circle.setAttribute('r', dimensions.radius);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', 'black');
    circle.setAttribute('stroke-width', '1');
    exportSvg.appendChild(circle);
    console.log('Added circle guide with radius:', dimensions.radius);
  }
  
  // Parse intervals
  const lines = intervalsTA.value.split(/\r?\n/);
  const items = [];
  
  // Add period point
  const periodInputValue = periodInput.value.trim();
  let periodDisplayValue;
  if (periodInputValue.includes('/')) {
    // Ratio input: keep as-is
    periodDisplayValue = periodInputValue;
  } else if (/^-?\d+(?:\.\d+)?(?:c|¢)?$/i.test(periodInputValue)) {
    // Cents input: strip cent sign, show number only
    periodDisplayValue = periodInputValue.replace(/[c¢]/ig, '').trim();
  } else {
    // Fallback: computed cents as number only
    periodDisplayValue = `${periodCents.toFixed(0)}`;
  }
  
  items.push({
    cents: 0,
    raw: periodDisplayValue,
    type: 'period',
    deg: 0,
    x: dimensions.centerX,
    y: dimensions.centerY - dimensions.radius
  });
  
  // Add other intervals
  for (const line of lines) {
    const it = parseCentsOrRatioToCents(line);
    if (!it) continue;
    const deg = ((it.cents / periodCents) * 360) % 360;
    const theta = (deg - 90) * Math.PI / 180;
    const x = dimensions.centerX + Math.cos(theta) * dimensions.radius;
    const y = dimensions.centerY + Math.sin(theta) * dimensions.radius;
    items.push({ ...it, deg, x, y });
  }
  
  console.log('Created', items.length, 'interval items');
  
  // Draw rays if enabled
  if (showRays.checked) {
    for (const d of items) {
      const a = (d.deg - 90) * Math.PI / 180;
      const x2 = dimensions.centerX + Math.cos(a) * dimensions.radius;
      const y2 = dimensions.centerY + Math.sin(a) * dimensions.radius;
      const ray = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      ray.setAttribute('x1', dimensions.centerX);
      ray.setAttribute('y1', dimensions.centerY);
      ray.setAttribute('x2', x2);
      ray.setAttribute('y2', y2);
      ray.setAttribute('stroke', 'black');
      ray.setAttribute('stroke-width', '1');
      exportSvg.appendChild(ray);
    }
    console.log('Added', items.length, 'rays');
  }
  
  // Draw points and labels
  for (const d of items) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // Point
    const pt = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pt.setAttribute('cx', d.x);
    pt.setAttribute('cy', d.y);
    pt.setAttribute('r', 5.2);
    pt.setAttribute('fill', 'black');
    pt.setAttribute('stroke', 'none');
    g.appendChild(pt);
    
    // Label
    if (showLabels.checked) {
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  const labelCircleRadius = dimensions.radius + parseFloat(labelDistance?.value || 35);
      const rad = (d.deg - 90) * Math.PI / 180;
      const lx = dimensions.centerX + Math.cos(rad) * labelCircleRadius;
      const ly = dimensions.centerY + Math.sin(rad) * labelCircleRadius;
  label.setAttribute('x', lx);
  label.setAttribute('y', ly);
  label.setAttribute('fill', 'black');
  label.setAttribute('font-size', labelSize.value);
  // Center the label on the label radius so its midpoint lies on the radial line
  label.setAttribute('dominant-baseline', 'middle');
  label.setAttribute('text-anchor', 'middle');
      label.textContent = d.raw;
      g.appendChild(label);
    }
    
    exportSvg.appendChild(g);
  }
  
  console.log('Added', items.length, 'points and labels');
  console.log('Final SVG size:', dimensions.size + 'x' + dimensions.size);
  
  return exportSvg;
}

// Export as SVG
function handleSvgExport() {
  console.log('=== SVG Export Started ===');
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
  console.log('SVG export completed');
}

// Export as raster image (PNG/JPG)
function handleRasterExport(format) {
  console.log(`=== ${format.toUpperCase()} Export Started ===`);
  
  const exportSvg = createExportSVG();
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(exportSvg);
  
  const squareSize = parseInt(exportSvg.getAttribute('width'));
  console.log('Raster export size:', squareSize + 'x' + squareSize);
  
  // Create a canvas for rasterization
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  
  // Set canvas to square size with high resolution
  const scale = 2; // 2x for high DPI
  canvas.width = squareSize * scale;
  canvas.height = squareSize * scale;
  
  console.log('Canvas size:', canvas.width + 'x' + canvas.height);
  
  img.onload = function() {
    console.log('Image loaded, drawing to canvas');
    
    // Fill white background for JPG
    if (format === 'jpg') {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Draw the SVG
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, squareSize, squareSize);
    
    // Export as blob
    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    canvas.toBlob(function(blob) {
      console.log('Created blob, downloading');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = getFilename(format);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 500);
      console.log(`${format.toUpperCase()} export completed`);
    }, mimeType, 0.95);
  };
  
  img.onerror = function(e) {
    console.error('Image loading failed:', e);
  };
  
  // Convert SVG to data URL
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  img.src = svgUrl;
  console.log('Loading SVG into image element');
}

// Wire up export buttons after DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const { exportSvgBtn, exportPngBtn, exportJpgBtn } = getExportDom();
  if (exportSvgBtn) exportSvgBtn.addEventListener('click', handleSvgExport);
  if (exportPngBtn) exportPngBtn.addEventListener('click', () => handleRasterExport('png'));
  if (exportJpgBtn) exportJpgBtn.addEventListener('click', () => handleRasterExport('jpg'));
});