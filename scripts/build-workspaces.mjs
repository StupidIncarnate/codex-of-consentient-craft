#!/usr/bin/env node
/**
 * Builds every workspace in DEPENDENCY order.
 *
 * `npm run build --workspaces` iterates workspaces in directory order — alphabetically — which in
 * this repo means `cli` (which depends on orchestrator, server, shared and testing) compiles FIRST
 * and `testing` (which twelve packages depend on) compiles TENTH. Against a warm `dist/` nobody
 * notices; against a COLD tree every package that sorts before its own dependencies fails with
 * TS6305 "output file has not been built from source file", and each of those cascades into the
 * `{}`-fallback errors (TS2339 / TS7006 / TS2322) that follow from an unresolved cross-package
 * import. A fresh riftcarver worktree is the one place this repo reliably builds cold, which is why
 * the carve log was the only place the bug was visible.
 *
 * `tsc -b` would order the graph itself — every package is `composite: true` with correct
 * `references`, and the root tsconfig is solution-style for exactly that purpose — but it drives
 * each package's `tsconfig.json`, and `cli` / `eslint-plugin` deliberately build through a narrower
 * `tsconfig.build.json` that excludes tests. Build mode would emit test files into the published
 * `dist/`, and it would skip the non-tsc build steps besides (cli's esbuild bundle, mcp's statics
 * copy, the chmod postbuilds, web's vite build). So this script keeps each package's OWN build
 * script and only fixes the order they run in.
 *
 * The order is DERIVED from each package.json's `@dungeonmaster/*` dependencies on every run — a
 * hardcoded list would silently skip a package added later, which is worse than building it in the
 * wrong order.
 */

import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const PACKAGES_DIR = 'packages';
const SCOPE = '@dungeonmaster/';

const readManifests = () => {
  const manifests = new Map();

  for (const dir of readdirSync(PACKAGES_DIR, { withFileTypes: true })) {
    if (!dir.isDirectory()) {
      continue;
    }

    const manifestPath = join(PACKAGES_DIR, dir.name, 'package.json');
    let raw;
    try {
      raw = readFileSync(manifestPath, 'utf8');
    } catch {
      continue;
    }

    const manifest = JSON.parse(raw);
    manifests.set(manifest.name, {
      dir: dir.name,
      hasBuild: Boolean(manifest.scripts?.build),
      deps: Object.keys({
        ...manifest.dependencies,
        ...manifest.devDependencies,
        ...manifest.peerDependencies,
      }).filter((dep) => dep.startsWith(SCOPE)),
    });
  }

  return manifests;
};

// Kahn's algorithm, alphabetical tiebreak within a tier so the order is stable run to run.
const topologicalOrder = ({ manifests }) => {
  const pending = new Map(
    [...manifests].map(([name, meta]) => [name, meta.deps.filter((dep) => manifests.has(dep))]),
  );
  const order = [];

  while (pending.size > 0) {
    const ready = [...pending]
      .filter(([, deps]) => deps.every((dep) => !pending.has(dep)))
      .map(([name]) => name)
      .sort();

    if (ready.length === 0) {
      throw new Error(
        `Dependency cycle among workspaces: ${[...pending.keys()].sort().join(', ')}`,
      );
    }

    for (const name of ready) {
      order.push(name);
      pending.delete(name);
    }
  }

  return order;
};

const manifests = readManifests();
const order = topologicalOrder({ manifests });

process.stdout.write(`build order: ${order.map((name) => name.slice(SCOPE.length)).join(' -> ')}\n`);

for (const name of order) {
  if (!manifests.get(name).hasBuild) {
    process.stdout.write(`skipping ${name} (no build script)\n`);
    continue;
  }

  const { status } = spawnSync('npm', ['run', 'build', `--workspace=${name}`], {
    stdio: 'inherit',
    shell: false,
  });

  // Fail fast. `npm run build --workspaces` carries on past a failing package and reports at the
  // end, which buries the FIRST error — the only one that is not a consequence of an earlier one —
  // under every cascade it caused.
  if (status !== 0) {
    process.stderr.write(`\nbuild failed in ${name} (exit ${String(status)})\n`);
    process.exit(status ?? 1);
  }
}
