#!/usr/bin/env node
/**
 * build.js — injects .env values into HTML files and writes output to dist/
 *
 * Usage:
 *   node build.js
 *
 * Reads VENMO_USERNAME from:
 *   1. Process environment (e.g. set by GitHub Actions secret)
 *   2. .env file in the project root
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Load .env (only if present — CI injects vars directly via environment)
// ---------------------------------------------------------------------------
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) return;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      // Don't override values already set in the environment
      if (!process.env[key]) process.env[key] = val;
    });
}

// ---------------------------------------------------------------------------
// Validate required vars
// ---------------------------------------------------------------------------
const VENMO_USERNAME = process.env.VENMO_USERNAME;

if (!VENMO_USERNAME || VENMO_USERNAME === 'YOUR_VENMO_USERNAME') {
  console.warn('WARN: VENMO_USERNAME is not set — Venmo checkout will be disabled in the built site.');
  console.warn('  Add a VENMO_USERNAME secret in GitHub Actions (Settings → Secrets → Actions) to enable it.');
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------
const SRC_DIR = __dirname;
const DIST_DIR = path.join(__dirname, 'dist');

if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR);

// Files that need placeholder substitution
const HTML_FILES = ['index.html', 'art-library.html', 'blog.html', 'linktree.html'];

// Static files to copy as-is
const STATIC_FILES = ['.nojekyll', 'og-image.svg'];

HTML_FILES.forEach(file => {
  const src = path.join(SRC_DIR, file);
  if (!fs.existsSync(src)) { console.warn(`WARN: ${file} not found, skipping.`); return; }
  const content = fs.readFileSync(src, 'utf8')
    .replace(/__VENMO_USERNAME__/g, VENMO_USERNAME || '');
  fs.writeFileSync(path.join(DIST_DIR, file), content);
  console.log(`  built  ${file}`);
});

STATIC_FILES.forEach(file => {
  const src = path.join(SRC_DIR, file);
  if (!fs.existsSync(src)) { console.warn(`WARN: ${file} not found, skipping.`); return; }
  fs.copyFileSync(src, path.join(DIST_DIR, file));
  console.log(`  copied ${file}`);
});

console.log(`\nBuild complete → dist/`);
