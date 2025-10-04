# Scale Circle Image Generator

A clean, interactive web application for visualizing musical intervals on a circular diagram, with support for both cent values and frequency ratios.

## Features

- **Flexible Input**: Enter intervals as cents (e.g., `700c`), ratios (e.g., `3/2`), or decimals (e.g., `1.5`)
- **Configurable Period**: Define the period as cents or ratio (default: `2/1` octave)
- **Interactive Controls**:
  - Toggle circle guide, radial lines, and labels
  - Adjust circle size, label size, and label distance
- **Export Options**: Save diagrams as SVG, PNG, or JPG with custom filenames
- **Clean Black-on-White Output**: Optimized for print and publication
- **High-DPI Exports**: Raster images exported at 2× resolution for crisp quality

## Usage

1. **Set the Period**: Enter the period in cents (e.g., `1200`) or as a ratio (e.g., `2/1`)
2. **Add Intervals**: Enter intervals in the text area, one per line
   - Cents: `700`, `700c`, `386.314c`
   - Ratios: `3/2`, `5/4`, `1.5`
   - Comments: Lines starting with `#` are ignored
3. **Customize**: Use sliders to adjust circle size, label size, and label distance
4. **Export**: Choose your format (SVG/PNG/JPG) and click to download

## Technical Details

### File Structure

```
ScaleCircle/
├── index.html      # Main HTML structure
├── styles.css      # Styling and layout
├── utils.js        # Shared utilities and constants
├── script.js       # Live diagram rendering
└── export.js       # Export functionality
```

### Architecture

- **Modular Design**: Shared utilities in `utils.js` eliminate code duplication
- **Constants**: Centralized configuration in `DEFAULTS` object
- **SVG-Based**: Uses native DOM SVG APIs for rendering
- **Responsive**: Adapts to container size and user preferences

### Formula

Angular position of intervals is calculated as:

```
θ = (interval_cents / period_cents) × 360° mod 360°
```

Where 0° is positioned at the top of the circle.

## Browser Compatibility

Works in all modern browsers supporting:
- ES6+ JavaScript
- SVG DOM manipulation
- Canvas API (for raster exports)

## License

Open source. Feel free to use and modify.

## Credits
Nick Vuci 2025
Created for visualizing microtonal scales and xenharmonic intervals.

Nikc
