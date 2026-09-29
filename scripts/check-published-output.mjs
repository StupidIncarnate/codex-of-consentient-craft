#!/usr/bin/env node
/**
 * Grades what each package's compiled `dist/` ships, in TWO categories that get different verdicts.
 *
 * FORBIDDEN — `.test.`, `.integration.`, anything under a `test/` directory inside dist, and, in every
 * package but `@dungeonmaster/testing` and the `@gateway/*` packages, `.proxy.`, `.stub.` and `.harness.`
 * files. These grade the source and nothing imports them from outside the package, so a `dist/`
 * carrying one is shipping test support to every consumer. This category FAILS the script.
 *
 * A stub or a proxy sits beside the file it belongs to and no production barrel exports it, so a
 * build that emits one has a production file importing it and the fix is that import. The
 * `./*.proxy` and `./*.stub` keys of an ordinary package carry only a `source` condition, which
 * resolves TypeScript and never reads `dist/`.
 *
 * PUBLISHED ON PURPOSE — `.proxy.`, `.stub.`, `.harness.` in `@dungeonmaster/testing` and the
 * `@gateway/*` packages. A consumer's own tests import them from `dist/` through those packages'
 * `import`/`require`/`types` conditions, so a file their exports name must compile into `dist/`.
 * This category is REPORTED and never fails.
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
import { listWorkspacePackageDirs } from './workspace-package-dirs.mjs';

const PACKAGES_DIR = 'packages';

const FORBIDDEN_NAME_MARKERS = ['.test.', '.integration.'];
const TEST_SUPPORT_NAME_MARKERS = ['.proxy.', '.stub.', '.harness.'];
const TEST_SUPPORT_PUBLISHERS = new Set(['testing']);
const GATEWAY_GROUP_PREFIX = '@gateway/';

const publishesTestSupport = ({ dir }) =>
  TEST_SUPPORT_PUBLISHERS.has(dir) || dir.startsWith(GATEWAY_GROUP_PREFIX);
const TEST_DIR_SEGMENT = 'test';

const collectFindings = ({ distPath, relative, testSupportIsPublished }) => {
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
      const nested = collectFindings({
        distPath: join(distPath, entry.name),
        relative: childRelative,
        testSupportIsPublished,
      });
      findings.forbidden.push(...nested.forbidden);
      findings.intentional.push(...nested.intentional);
      continue;
    }

    // Forbidden wins a name that carries both markers: `foo.stub.test.js` is a test.
    if (FORBIDDEN_NAME_MARKERS.some((marker) => entry.name.includes(marker))) {
      findings.forbidden.push(childRelative);
      continue;
    }

    if (TEST_SUPPORT_NAME_MARKERS.some((marker) => entry.name.includes(marker))) {
      (testSupportIsPublished ? findings.intentional : findings.forbidden).push(childRelative);
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

const packageDirs = listWorkspacePackageDirs({ packagesDir: PACKAGES_DIR }).sort();

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
  const findings = collectFindings({
    distPath,
    relative: '',
    testSupportIsPublished: publishesTestSupport({ dir }),
  });
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
    '\nProxy / stub / harness files in dist — published on purpose by testing and the gateway packages,\nso these are reported and do not fail:\n',
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
    `\n${String(failing.length)} package(s) publish test suites or test support. Narrow each one's build config exclude list, or remove the production import that drags the file in.\n`,
  );
  process.exit(1);
}

process.stdout.write('\nNo test suites in any published dist.\n');
