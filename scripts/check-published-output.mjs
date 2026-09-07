#!/usr/bin/env node
/**
 * Grades what each package's compiled `dist/` ships, in TWO categories that get different verdicts.
 *
 * FORBIDDEN — `.test.`, `.integration.`, and anything under a `test/` directory inside dist. These
 * grade the source and nothing imports them from outside the package, so a `dist/` carrying one is
 * shipping a suite to every consumer. This category FAILS the script.
 *
 * PUBLISHED ON PURPOSE — `.proxy.`, `.stub.`, `.harness.`. These look like test-only code and are
 * not: several packages export them as real public API, so a consumer's own tests can build the
 * same fixtures and mock the same adapters. `@dungeonmaster/shared/contracts` re-exports the stub
 * beside every contract, `@dungeonmaster/shared/testing` IS the proxy barrel, and
 * `@dungeonmaster/testing` and `@dungeonmaster/config` export stubs from their own index. A file a
 * barrel exports must compile into `dist/` or the export resolves to nothing — so this category is
 * REPORTED and never fails. What makes it correct is the barrel: an entry here whose package
 * exports nothing of the kind is a build config emitting more than it means to, and the fix is that
 * package's `tsconfig.build.json` exclude list.
 *
 * `.d.ts` and `.js.map` siblings count as the same file by another extension, in both categories.
 *
 * PREREQUISITE: run `npm run build:clean`, not `npm run build`. This script reads compiled output,
 * so against a clean tree it reports every package as having no dist and exits 1 telling you to
 * build — and against a WARM one it grades files no current build config would emit. `tsc` writes
 * `dist/` and never prunes it, so anything an exclude list started dropping is still sitting there
 * from the build before it, and the FORBIDDEN count reads in the thousands while every config is
 * correct. Only a cold tree answers the question this script asks.
 *
 * Ward does not run this. `scripts/**` is in eslint.config.js `ignores` and belongs to no
 * workspace package, so a ward invocation naming this file processes nothing. Run it directly:
 *
 *   npm run check:published
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PACKAGES_DIR = 'packages';

const FORBIDDEN_NAME_MARKERS = ['.test.', '.integration.'];
const INTENTIONAL_NAME_MARKERS = ['.proxy.', '.stub.', '.harness.'];
const TEST_DIR_SEGMENT = 'test';

const collectFindings = ({ distPath, relative }) => {
  const findings = { forbidden: [], intentional: [] };

  let entries;
  try {
    entries = readdirSync(distPath, { withFileTypes: true });
  } catch {
    return findings;
  }

  for (const entry of entries) {
    const childRelative = relative === '' ? entry.name : `${relative}/${entry.name}`;

    if (entry.isDirectory()) {
      // A `test/` directory inside dist is forbidden wholesale — every file under it, whatever
      // it is named.
      if (entry.name === TEST_DIR_SEGMENT) {
        findings.forbidden.push(
          ...listEverything({ dirPath: join(distPath, entry.name), relative: childRelative }),
        );
        continue;
      }
      const nested = collectFindings({ distPath: join(distPath, entry.name), relative: childRelative });
      findings.forbidden.push(...nested.forbidden);
      findings.intentional.push(...nested.intentional);
      continue;
    }

    // Forbidden wins a name that carries both markers: `foo.stub.test.js` is a test.
    if (FORBIDDEN_NAME_MARKERS.some((marker) => entry.name.includes(marker))) {
      findings.forbidden.push(childRelative);
      continue;
    }

    if (INTENTIONAL_NAME_MARKERS.some((marker) => entry.name.includes(marker))) {
      findings.intentional.push(childRelative);
    }
  }

  return findings;
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
    rows.push({ name: manifest.name, dir, skipped: 'private', forbidden: [], intentional: [] });
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
    rows.push({ name: manifest.name, dir, skipped: 'no dist', forbidden: [], intentional: [] });
    continue;
  }

  anyDistFound = true;
  const findings = collectFindings({ distPath, relative: '' });
  rows.push({
    name: manifest.name,
    dir,
    skipped: null,
    forbidden: findings.forbidden,
    intentional: findings.intentional,
    filesField: manifest.files ?? null,
  });
}

const nameWidth = Math.max(...rows.map((row) => row.name.length));
process.stdout.write('published dist\n\n');
process.stdout.write(`  ${'package'.padEnd(nameWidth)}  ${'FORBIDDEN'.padStart(9)}  ${'exported'.padStart(8)}\n`);

for (const row of rows) {
  const label = row.name.padEnd(nameWidth);
  if (row.skipped !== null) {
    process.stdout.write(`  ${label}  —  (${row.skipped})\n`);
    continue;
  }
  const filesNote = row.filesField === null ? '  NO files FIELD — publishes everything' : '';
  process.stdout.write(
    `  ${label}  ${String(row.forbidden.length).padStart(9)}  ${String(row.intentional.length).padStart(8)}${filesNote}\n`,
  );
}

if (!anyDistFound) {
  process.stderr.write('\nNo packages/*/dist found. Run `npm run build:clean` first.\n');
  process.exit(1);
}

const publishingIntentional = rows.filter((row) => row.skipped === null && row.intentional.length > 0);

if (publishingIntentional.length > 0) {
  process.stdout.write(
    '\nProxy / stub / harness files in dist — published on purpose by the packages whose barrels\nexport them, so these are reported and do not fail:\n',
  );
  for (const row of publishingIntentional) {
    process.stdout.write(`\n  ${row.name} (${String(row.intentional.length)}):\n`);
    for (const file of row.intentional.slice(0, 5)) {
      process.stdout.write(`    dist/${file}\n`);
    }
    if (row.intentional.length > 5) {
      process.stdout.write(`    ... and ${String(row.intentional.length - 5)} more\n`);
    }
  }
}

const failing = rows.filter((row) => row.skipped === null && row.forbidden.length > 0);

if (failing.length > 0) {
  process.stdout.write('\nFirst FORBIDDEN files per failing package:\n');
  for (const row of failing) {
    process.stdout.write(`\n  ${row.name} (${String(row.forbidden.length)}):\n`);
    for (const file of row.forbidden.slice(0, 5)) {
      process.stdout.write(`    dist/${file}\n`);
    }
    if (row.forbidden.length > 5) {
      process.stdout.write(`    ... and ${String(row.forbidden.length - 5)} more\n`);
    }
  }
  process.stderr.write(
    `\n${String(failing.length)} package(s) publish test suites. Narrow each one's build config exclude list.\n`,
  );
  process.exit(1);
}

process.stdout.write('\nNo test suites in any published dist.\n');
