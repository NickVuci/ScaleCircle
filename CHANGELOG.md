# Changelog

## Version 2.1 - UI Refinement (Current)

### UI/UX Improvements
- **Square Canvas**: Preview canvas is now square (1:1 aspect ratio) to match export output
- **Three-Column Layout**: 
  - Left: Scale data input (period and intervals)
  - Center: Square preview canvas
  - Right: Display controls (toggles and sliders)
- **Export Controls in Header**: Moved export filename and format buttons to top-right of screen for quick access
- **Improved Responsive Design**: Better mobile and tablet layouts with intelligent column stacking
- **Cleaner Organization**: Related controls grouped together for better workflow

### Visual Changes
- Removed legend (no longer needed with cleaner layout)
- Removed period info display pill
- Better spacing and alignment throughout
- Square canvas perfectly matches export dimensions

## Version 2.0 - Final Polish

### Major Refactoring
- **Created `utils.js`**: Centralized all shared utilities and constants
  - Moved parsing functions (`parseRatio`, `parseCentsOrRatioToCents`, `parsePeriodToCents`)
  - Moved helper functions (`normalizePeriodLabel`, `buildItems`, `calculateDimensions`, `createSVGElement`)
  - Added `DEFAULTS` constant object for all magic numbers
  - Added `SVG_NS` constant for SVG namespace

### Code Quality Improvements
- **Eliminated Duplication**: Removed 100+ lines of duplicated code between `script.js` and `export.js`
- **Improved Organization**: 
  - `script.js`: Focused on live rendering with clear helper functions
  - `export.js`: Focused on export functionality using shared utilities
  - `utils.js`: Single source of truth for shared logic
- **Better Naming**: Consistent variable naming throughout (`items` instead of `d`, `angle` instead of `a`, etc.)
- **Added JSDoc Comments**: Comprehensive documentation for all functions
- **Constants for Magic Numbers**: 
  - `PADDING = 60`
  - `MIN_RADIUS = 20`
  - `POINT_RADIUS = 5.2`
  - `LABEL_DISTANCE = 35`
  - `EXPORT_SCALE = 2`
  - And more...

### Architecture Improvements
- **Modular Design**: Clean separation of concerns
- **DRY Principle**: Single implementation of shared logic
- **Maintainability**: Easier to update and extend
- **Testability**: Pure functions separated from DOM manipulation

### File Structure
```
ScaleCircle/
├── index.html      # Main HTML structure
├── styles.css      # Styling and layout
├── utils.js        # Shared utilities (NEW)
├── script.js       # Live diagram rendering (REFACTORED)
├── export.js       # Export functionality (REFACTORED)
└── README.md       # Documentation (NEW)
```

### Bug Fixes
- Fixed inconsistent label distance defaults
- Improved error handling for invalid period values
- Better graceful degradation for edge cases

### Performance
- Reduced code size by ~30% through deduplication
- Cleaner DOM manipulation with `createSVGElement` helper
- No performance regression - maintains same speed

## Version 1.0 - Initial Implementation

### Features
- Interactive pitch-class circle visualization
- Support for cents and ratio inputs
- Configurable period
- Toggle controls for circle, rays, and labels
- Size controls for circle, labels, and label distance
- Export to SVG, PNG, and JPG formats
- Black-on-white output for print quality
- High-DPI raster exports (2× resolution)
- Centered label alignment on radial lines
- Period label normalization (removes cent symbols)

### Technical Details
- Pure HTML/CSS/JavaScript
- SVG-based rendering
- Canvas API for raster exports
- Responsive design
- No external dependencies
