#!/usr/bin/env node
/**
 * Removes unused i18n keys from src/i18n/resources.ts.
 *
 * Parses the resources object, checks each leaf key against src/ usage,
 * then rewrites resources.ts without the unused keys.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_DIR = path.resolve(__dirname, '..');
const RESOURCES_FILE = path.join(PROJECT_DIR, 'src/i18n/resources.ts');
const SRC_DIR = path.join(PROJECT_DIR, 'src');
const APP_DIR = path.join(PROJECT_DIR, 'app');

// Parse resources.ts into a JS object
const raw = fs.readFileSync(RESOURCES_FILE, 'utf8');
const cleaned = raw
  .replace(/export\s+const/g, 'const')
  .replace(/export\s+type\s+.*$/gm, '');
const fn = new Function(cleaned + '; return resources;');
const resources = fn();

// Collect all leaf key paths from en.translation
function getLeafKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      keys.push(...getLeafKeys(value, p));
    } else {
      keys.push(p);
    }
  }
  return keys;
}

const allKeys = getLeafKeys(resources.en.translation);

// Safelist for keys used dynamically (via t(`some.${dynamic}`))
const SAFE_PREFIXES = ['appointments.status.', 'booking.steps.', 'common.'];

// Check which keys are unused
function isKeyUsed(key) {
  if (key === 'appName') return true;
  if (SAFE_PREFIXES.some((prefix) => key.startsWith(prefix))) return true;

  try {
    execSync(
      `grep -r --include='*.ts' --include='*.tsx' --exclude='resources.ts' -q "${key}" "${SRC_DIR}" "${APP_DIR}"`,
      { stdio: 'ignore' },
    );
    return true;
  } catch {
    return false;
  }
}

const unusedKeys = allKeys.filter((k) => !isKeyUsed(k));

if (unusedKeys.length === 0) {
  console.log('✅ No unused i18n keys found.');
  process.exit(0);
}

console.log(`Found ${unusedKeys.length} unused key(s). Removing...`);

// Build a Set of unused dotted paths for fast lookup
const unusedSet = new Set(unusedKeys);

// Deep-clone an object, omitting keys whose dotted path is in unusedSet.
// Also prune empty parent objects left behind after removal.
function pruneObject(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      const pruned = pruneObject(value, p);
      if (Object.keys(pruned).length > 0) {
        result[key] = pruned;
      }
    } else if (!unusedSet.has(p)) {
      result[key] = value;
    }
  }
  return result;
}

// Prune both language blocks
const prunedResources = {};
for (const [lang, langObj] of Object.entries(resources)) {
  prunedResources[lang] = {
    translation: pruneObject(langObj.translation),
  };
}

// Serialize back to TypeScript source
function serialize(obj, indent = 0) {
  const pad = ' '.repeat(indent);
  const innerPad = ' '.repeat(indent + 2);
  const entries = Object.entries(obj);
  const lines = [];

  for (const [key, value] of entries) {
    const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;
    if (typeof value === 'object' && value !== null) {
      lines.push(`${innerPad}${safeKey}: ${serialize(value, indent + 2)},`);
    } else if (typeof value === 'string') {
      const escaped = value
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\n/g, '\\n');
      if (value.includes('\n')) {
        lines.push(`${innerPad}${safeKey}:\n${innerPad}  '${escaped}',`);
      } else {
        lines.push(`${innerPad}${safeKey}: '${escaped}',`);
      }
    } else {
      lines.push(`${innerPad}${safeKey}: ${JSON.stringify(value)},`);
    }
  }

  return `{\n${lines.join('\n')}\n${pad}}`;
}

const output = `export const resources = ${serialize(prunedResources)};

export type AppLanguage = keyof typeof resources;
`;

fs.writeFileSync(RESOURCES_FILE, output, 'utf8');

console.log(`\nRemoved ${unusedKeys.length} unused key(s):`);
for (const k of unusedKeys) {
  console.log(`  - ${k}`);
}
console.log(`\n✅ resources.ts updated.`);
