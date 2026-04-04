#!/usr/bin/env bash
#
# Checks for unused i18n keys in resources.ts.
# Extracts all leaf key paths (e.g. "common.save", "booking.steps.services")
# from the `en` translation block, then greps the src/ directory (excluding
# resources.ts itself) to see if each key is referenced anywhere.
#
# Exit code 1 if unused keys are found, 0 otherwise.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
RESOURCES_FILE="$PROJECT_DIR/src/i18n/resources.ts"
SRC_DIR="$PROJECT_DIR/src"

if [ ! -f "$RESOURCES_FILE" ]; then
  echo "resources.ts not found at $RESOURCES_FILE"
  exit 1
fi

# Extract all leaf key paths from the English translation block.
extract_keys() {
  node -e "
    const fs = require('fs');
    let src = fs.readFileSync('$RESOURCES_FILE', 'utf8');

    // Remove export keywords and type exports so it's valid JS
    src = src.replace(/export\s+const/g, 'const');
    src = src.replace(/export\s+type\s+.*$/gm, '');

    // Wrap in a function that returns resources
    const fn = new Function(src + '; return resources;');
    const resources = fn();
    const translations = resources.en.translation;

    function getLeafKeys(obj, prefix) {
      for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? prefix + '.' + key : key;
        if (typeof value === 'object' && value !== null) {
          getLeafKeys(value, path);
        } else {
          console.log(path);
        }
      }
    }
    getLeafKeys(translations, '');
  "
}

# Safelist for keys used dynamically (via t(`some.${dynamic}`))
# Add prefixes here that should never be flagged as unused.
SAFE_PREFIXES=("appointments.status" "booking.steps" "common.")

is_safe() {
  local key="$1"
  for prefix in "${SAFE_PREFIXES[@]}"; do
    if [[ "$key" == "$prefix"* ]]; then
      return 0
    fi
  done
  return 1
}

KEYS=$(extract_keys)
UNUSED_KEYS=()

while IFS= read -r key; do
  # Skip the top-level appName key or any key in the safelist
  [ "$key" = "appName" ] && continue
  is_safe "$key" && continue

  # Search for the key in src/ and app/ files, excluding resources.ts
  if ! grep -r --include='*.ts' --include='*.tsx' -q "$key" \
       --exclude='resources.ts' "$SRC_DIR" "$PROJECT_DIR/app"; then
    UNUSED_KEYS+=("$key")
  fi
done <<< "$KEYS"

if [ ${#UNUSED_KEYS[@]} -gt 0 ]; then
  echo ""
  echo "🚫 Found ${#UNUSED_KEYS[@]} unused i18n key(s) in resources.ts:"
  echo ""
  for k in "${UNUSED_KEYS[@]}"; do
    echo "  - $k"
  done
  echo ""
  echo "Remove these keys from src/i18n/resources.ts (both 'tr' and 'en' blocks) before committing."
  exit 1
fi

echo "✅ All i18n keys are in use."
exit 0
