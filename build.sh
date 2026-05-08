#!/bin/bash
# EnnHealth Psychiatry — Build Script
# Minifies CSS and JS, regenerates sitemap.
# Prerequisites: npm install -g terser clean-css-cli
# Run: bash build.sh

set -e

echo "=== EnnHealth Build ==="

# Check for required tools
if ! command -v terser &> /dev/null; then
  echo "Installing terser..."
  npm install -g terser
fi
if ! command -v cleancss &> /dev/null; then
  echo "Installing clean-css-cli..."
  npm install -g clean-css-cli
fi

# Create dist directory
mkdir -p dist

# ─── Minify CSS ───
echo "Minifying CSS..."
cleancss -o dist/styles.min.css styles.css
CSS_ORIG=$(wc -c < styles.css)
CSS_MIN=$(wc -c < dist/styles.min.css)
echo "  styles.css: ${CSS_ORIG} → ${CSS_MIN} bytes ($(( (CSS_ORIG - CSS_MIN) * 100 / CSS_ORIG ))% reduction)"

# ─── Minify JS ───
echo "Minifying JavaScript..."
for jsfile in main.js mobile-app.js screening.js shared-header.js ga-events.js gtag-init.js sw-register.js sw.js; do
  if [ -f "$jsfile" ]; then
    terser "$jsfile" --compress --mangle -o "dist/${jsfile%.js}.min.js"
    JS_ORIG=$(wc -c < "$jsfile")
    JS_MIN=$(wc -c < "dist/${jsfile%.js}.min.js")
    echo "  ${jsfile}: ${JS_ORIG} → ${JS_MIN} bytes ($(( (JS_ORIG - JS_MIN) * 100 / JS_ORIG ))% reduction)"
  fi
done

# ─── Regenerate Sitemap ───
echo "Regenerating sitemap..."
bash build-sitemap.sh

echo ""
echo "=== Build Complete ==="
echo "Minified files are in dist/"
echo ""
echo "To use minified files in production, update index.html references:"
echo "  styles.css        → dist/styles.min.css"
echo "  main.js           → dist/main.min.js"
echo "  mobile-app.js     → dist/mobile-app.min.js"
echo "  screening.js      → dist/screening.min.js"
echo "  shared-header.js  → dist/shared-header.min.js"
echo "  ga-events.js      → dist/ga-events.min.js"
echo "  gtag-init.js      → dist/gtag-init.min.js"
echo "  sw-register.js    → dist/sw-register.min.js"
echo "  sw.js             → dist/sw.min.js"
