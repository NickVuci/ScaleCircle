// Shared utilities for pitch-class circle application

// Constants
const SVG_NS = 'http://www.w3.org/2000/svg';

const DEFAULTS = {
  PADDING: 60,
  MIN_RADIUS: 20,
  MIN_DIMENSION: 400,
  POINT_RADIUS: 5.2,
  LABEL_DISTANCE: 35,
  EXPORT_PADDING: 30,
  EXPORT_MIN_SIZE: 300,
  EXPORT_SCALE: 2 // High DPI for raster exports
};

// Math helpers
const log2 = x => Math.log(x) / Math.LN2;

/**
 * Parse a ratio string (e.g., "3/2" or "1.5") into a decimal number
 * @param {string} str - Input string
 * @returns {number|null} Parsed ratio or null if invalid
 */
function parseRatio(str) {
  const s = String(str).trim();
  if (!s) return null;
  
  if (s.includes('/')) {
    const [a, b] = s.split('/').map(Number);
    if (isFinite(a) && isFinite(b) && b !== 0) return a / b;
    return null;
  }
  
  const n = Number(s);
  if (isFinite(n) && n > 0) return n;
  return null;
}

/**
 * Parse a cents or ratio token into cents value with metadata
 * @param {string} token - Input token (e.g., "700c", "3/2", "386.314")
 * @returns {{cents: number, raw: string, type: 'cents'|'ratio'}|null}
 */
function parseCentsOrRatioToCents(token) {
  const raw = String(token).trim();
  if (!raw || raw.startsWith('#')) return null;
  
  // Check if it's a cents value (with optional 'c' or '¢' suffix)
  const centsLike = raw.replace(/\s/g, '');
  if (/^-?\d+(?:\.\d+)?(?:c|¢)?$/i.test(centsLike)) {
    const n = Number(centsLike.replace(/[c¢]/ig, ''));
    if (isFinite(n)) return { cents: n, raw, type: 'cents' };
  }
  
  // Try parsing as ratio
  const r = parseRatio(raw);
  if (r != null) {
    const cents = 1200 * log2(r);
    return { cents, raw, type: 'ratio' };
  }
  
  return null;
}

/**
 * Parse period input (cents or ratio) into cents value
 * @param {string} str - Period input string
 * @returns {number} Period in cents, or NaN if invalid
 */
function parsePeriodToCents(str) {
  const s = String(str || '').trim();
  if (!s) return NaN;
  
  // Check if it's a cents value
  if (/^-?\d+(?:\.\d+)?(?:c|¢)?$/i.test(s)) {
    return Number(s.replace(/[c¢]/ig, ''));
  }
  
  // Try parsing as ratio
  const r = parseRatio(s);
  if (r != null) return 1200 * log2(r);
  
  return NaN;
}

/**
 * Normalize period label for display (remove cent symbols for cent values, keep ratios)
 * @param {string} inputValue - Raw period input value
 * @param {number} periodCents - Computed period in cents
 * @returns {string} Normalized display value
 */
function normalizePeriodLabel(inputValue, periodCents) {
  const s = String(inputValue || '').trim();
  if (!s) return `${periodCents.toFixed(0)}`;
  
  // Keep ratio format as-is
  if (s.includes('/')) return s;
  
  // Strip cent symbols from cent values
  if (/^-?\d+(?:\.\d+)?(?:c|¢)?$/i.test(s)) {
    return s.replace(/[c¢]/ig, '').trim();
  }
  
  // Fallback to computed cents (no symbol)
  return `${periodCents.toFixed(0)}`;
}

/**
 * Build items array (period + intervals) with positions
 * @param {string} periodInputValue - Period input value
 * @param {string} intervalsText - Intervals textarea content
 * @param {number} cx - Center X coordinate
 * @param {number} cy - Center Y coordinate
 * @param {number} radius - Circle radius
 * @param {number} periodCents - Period in cents
 * @returns {Array} Array of item objects with position data
 */
function buildItems(periodInputValue, intervalsText, cx, cy, radius, periodCents) {
  const items = [];
  
  // Add period at top (0 degrees)
  const periodLabel = normalizePeriodLabel(periodInputValue, periodCents);
  items.push({
    cents: 0,
    raw: periodLabel,
    type: 'period',
    deg: 0,
    x: cx,
    y: cy - radius
  });
  
  // Parse and add intervals
  const lines = intervalsText.split(/\r?\n/);
  for (const line of lines) {
    const it = parseCentsOrRatioToCents(line);
    if (!it) continue;
    
    const deg = ((it.cents / periodCents) * 360) % 360;
    const theta = (deg - 90) * Math.PI / 180; // 0° at top
    const x = cx + Math.cos(theta) * radius;
    const y = cy + Math.sin(theta) * radius;
    
    items.push({ ...it, deg, x, y });
  }
  
  return items;
}

/**
 * Calculate dimensions for rendering based on container and settings
 * @param {DOMRect} containerRect - Container bounding rectangle
 * @param {number} circleSizeMultiplier - Circle size slider value
 * @returns {{W: number, H: number, cx: number, cy: number, radius: number}}
 */
function calculateDimensions(containerRect, circleSizeMultiplier) {
  const W = Math.max(containerRect.width, DEFAULTS.MIN_DIMENSION);
  const H = Math.max(containerRect.height, DEFAULTS.MIN_DIMENSION);
  
  const maxRadius = Math.min(W, H) / 2 - DEFAULTS.PADDING;
  const baseRadius = Math.max(DEFAULTS.MIN_RADIUS, maxRadius);
  const radius = baseRadius * circleSizeMultiplier;
  
  return {
    W,
    H,
    cx: W / 2,
    cy: H / 2,
    radius
  };
}

/**
 * Create an SVG element with specified attributes
 * @param {string} tag - SVG element tag name
 * @param {Object} attrs - Attributes to set
 * @returns {SVGElement}
 */
function createSVGElement(tag, attrs = {}) {
  const elem = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    elem.setAttribute(key, value);
  }
  return elem;
}
