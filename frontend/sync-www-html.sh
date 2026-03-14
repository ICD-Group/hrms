#!/bin/bash
# Sync Vite build asset references into www/hrms.html
# Run after: yarn build / npx vite build

FRONTEND_INDEX="../hrms/public/frontend/index.html"
WWW_HTML="../hrms/www/hrms.html"

if [ ! -f "$FRONTEND_INDEX" ] || [ ! -f "$WWW_HTML" ]; then
  echo "ERROR: Files not found. Run from frontend/ directory."
  exit 1
fi

# Extract new references from build output
NEW_INDEX_JS=$(grep -o 'src="/assets/[^"]*\.js"' "$FRONTEND_INDEX" | grep -o '[^/"]*\.js')
NEW_FRAPPE_UI_JS=$(grep -o 'href="/assets/frappe-ui-[^"]*\.js"' "$FRONTEND_INDEX" | grep -o 'frappe-ui-[^"]*\.js')
NEW_IONIC_JS=$(grep -o 'href="/assets/ionic-[^"]*\.js"' "$FRONTEND_INDEX" | grep -o 'ionic-[^"]*\.js')
NEW_FRAPPE_UI_CSS=$(grep -o 'href="/assets/frappe-ui-[^"]*\.css"' "$FRONTEND_INDEX" | grep -o 'frappe-ui-[^"]*\.css')
NEW_INDEX_CSS=$(grep -o 'href="/assets/index-[^"]*\.css"' "$FRONTEND_INDEX" | grep -o 'index-[^"]*\.css')
NEW_APP_VERSION=$(grep -o '"icd_app_version",V="[^"]*"' "$FRONTEND_INDEX" | grep -o 'V="[^"]*"' | cut -d'"' -f2)

# Replace in www/hrms.html
sed -i "s|index-[A-Za-z0-9_-]*\.js|$NEW_INDEX_JS|" "$WWW_HTML"
sed -i "s|frappe-ui-[A-Za-z0-9_-]*\.js|$NEW_FRAPPE_UI_JS|" "$WWW_HTML"
sed -i "s|ionic-[A-Za-z0-9_-]*\.js|$NEW_IONIC_JS|" "$WWW_HTML"
sed -i "s|frappe-ui-[A-Za-z0-9_-]*\.css|$NEW_FRAPPE_UI_CSS|" "$WWW_HTML"
sed -i "s|index-[A-Za-z0-9_-]*\.css|$NEW_INDEX_CSS|" "$WWW_HTML"
[ -n "$NEW_APP_VERSION" ] && sed -i "s|V=\"[a-f0-9]*\"|V=\"$NEW_APP_VERSION\"|" "$WWW_HTML"

echo "Synced www/hrms.html:"
echo "  index.js   -> $NEW_INDEX_JS"
echo "  frappe-ui  -> $NEW_FRAPPE_UI_JS"
echo "  ionic      -> $NEW_IONIC_JS"
echo "  css index  -> $NEW_INDEX_CSS"
echo "  version    -> $NEW_APP_VERSION"
