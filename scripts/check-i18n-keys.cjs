#!/usr/bin/env node

/**
 * i18n locale key consistency checker
 * Compares all locale files against en.json (reference) and reports missing/extra keys.
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales');
const REFERENCE_LOCALE = 'en';

function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

function loadLocale(filename) {
  const filePath = path.join(LOCALES_DIR, filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

function main() {
  const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.json'));
  const referenceFile = `${REFERENCE_LOCALE}.json`;

  if (!files.includes(referenceFile)) {
    console.error(`Reference locale file not found: ${referenceFile}`);
    process.exit(1);
  }

  const referenceData = loadLocale(referenceFile);
  const referenceKeys = new Set(flattenKeys(referenceData));

  let hasErrors = false;

  for (const file of files) {
    if (file === referenceFile) continue;

    const locale = file.replace('.json', '');
    const data = loadLocale(file);
    const keys = new Set(flattenKeys(data));

    const missing = [...referenceKeys].filter(k => !keys.has(k));
    const extra = [...keys].filter(k => !referenceKeys.has(k));

    if (missing.length > 0 || extra.length > 0) {
      hasErrors = true;
      console.error(`\n❌ ${locale} (${file}):`);
      if (missing.length > 0) {
        console.error(`  Missing keys (${missing.length}):`);
        for (const key of missing) {
          console.error(`    - ${key}`);
        }
      }
      if (extra.length > 0) {
        console.error(`  Extra keys (${extra.length}):`);
        for (const key of extra) {
          console.error(`    + ${key}`);
        }
      }
    } else {
      console.log(`✅ ${locale} (${file}): OK — ${keys.size} keys`);
    }
  }

  if (hasErrors) {
    console.error('\n❌ Locale key inconsistencies found. Fix the above issues.');
    process.exit(1);
  } else {
    console.log(`\n✅ All locales are consistent with ${REFERENCE_LOCALE}.json (${referenceKeys.size} keys)`);
  }
}

main();
