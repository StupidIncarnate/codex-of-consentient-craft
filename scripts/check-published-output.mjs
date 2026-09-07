#!/usr/bin/env node
/**
 * Fails when a package's compiled `dist/` carries test-only code.
 *
 * Test, proxy, stub and harness files exist to grade the source. Emitting them into `dist/` ships
 * them to every consumer, and — because a proxy file's whole job is to call `registerMock` —
 * hands a consumer's runtime a module graph that reaches into jest. The published tarball should
 * carry the implementation and nothing else.
 *
 * PREREQUISITE: `npm run build` must have run. This script reads compiled output, so against a
 * clean tree it reports every package as having no dist and exits 1 telling you to build.
 *
 * Ward does not run this. `scripts/**` is in eslint.config.js `ignores` and belongs to no
 * workspace package, so a ward invocation naming this file processes nothing. Run it directly:
 *
 *   npm run check:published
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PACKAGES_DIR = 'packages';

// A compiled file is test-only when its name carries one of these markers, or when it sits
// anywhere under a `test/` directory inside dist. `.d.ts` and `.js.map` siblings count too —
// they are the same file by another extension.
const TEST_NAME_MARKERS = ['.test.', '.proxy.', '.stub.', '.harness.', '.integration.'];
const TEST_DIR_SEGMENT = 'test';

const collectOffenders = ({ distPath, relative }) => {
  const offenders = [];

  let entries;
  try {
    entries = readdirSync(distPath, { withFileTypes: true });
  } catch {
    return offenders;
  }

  for (const entry of entries) {
    const childRelative = relative === '' ? entry.name : `${relative}/${entry.name}`;

    if (entry.isDirectory()) {
      if (entry.name === TEST_DIR_SEGMENT) {
        offenders.push(...listEverything({ dirPath: join(distPath, entry.name), relative: childRelative }));
        continue;
      }
      offenders.push(...collectOffenders({ distPath: join(distPath, entry.name), relative: childRelative }));
      continue;
    }

    if (TEST_NAME_MARKERS.some((marker) => entry.name.includes(marker))) {
      offenders.push(childRelative);
    }
  }

  return offenders;
};

const listEverything = ({ dirPath, relative }) => {
  const found = [];
  let entries;
  try {
    entries = readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    const childRelative = `${relative}/${entry.name}`;
    if (entry.isDirectory()) {
      found.push(...listEverything({ dirPath: join(dirPath, entry.name), relative: childRelative }));
      continue;
    }
    found.push(childRelative);
  }
  return found;
};

const packageDirs = readdirSync(PACKAGES_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const rows = [];
let anyDistFound = false;

for (const dir of packageDirs) {
  const manifestPath = join(PACKAGES_DIR, dir, 'package.json');
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    continue;
  }

  if (manifest.private === true) {
    rows.push({ name: manifest.name, dir, skipped: 'private', count: 0, offenders: [] });
    continue;
  }

  const distPath = join(PACKAGES_DIR, dir, 'dist');
  let distExists = true;
  try {
    distExists = statSync(distPath).isDirectory();
  } catch {
    distExists = false;
  }

  if (!distExists) {
    rows.push({ name: manifest.name, dir, skipped: 'no dist', count: 0, offenders: [] });
    continue;
  }

  anyDistFound = true;
  const offenders = collectOffenders({ distPath, relative: '' });
  rows.push({
    name: manifest.name,
    dir,
    skipped: null,
    count: offenders.length,
    offenders,
    filesField: manifest.files ?? null,
  });
}

const nameWidth = Math.max(...rows.map((row) => row.name.length));
process.stdout.write('published dist — test-only files\n\n');

for (const row of rows) {
  const label = row.name.padEnd(nameWidth);
  if (row.skipped !== null) {
    process.stdout.write(`  ${label}  —  (${row.skipped})\n`);
    continue;
  }
  const filesNote = row.filesField === null ? '  NO files FIELD — publishes everything' : '';
  process.stdout.write(`  ${label}  ${String(row.count).padStart(5)}${filesNote}\n`);
}

if (!anyDistFound) {
  process.stderr.write('\nNo packages/*/dist found. Run `npm run build` first.\n');
  process.exit(1);
}

const failing = rows.filter((row) => row.skipped === null && row.count > 0);

if (failing.length > 0) {
  process.stdout.write('\nFirst offenders per failing package:\n');
  for (const row of failing) {
    process.stdout.write(`\n  ${row.name} (${String(row.count)}):\n`);
    for (const offender of row.offenders.slice(0, 5)) {
      process.stdout.write(`    dist/${offender}\n`);
    }
    if (row.offenders.length > 5) {
      process.stdout.write(`    ... and ${String(row.offenders.length - 5)} more\n`);
    }
  }
  process.stderr.write(
    `\n${String(failing.length)} package(s) publish test-only code. Narrow each one's build config exclude list.\n`,
  );
  process.exit(1);
}

process.stdout.write('\nNo test-only files in any published dist.\n');
