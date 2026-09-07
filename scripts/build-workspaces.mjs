#!/usr/bin/env node
/**
 * Builds every workspace in DEPENDENCY order.
 *
 * `npm run build --workspaces` iterates workspaces in directory order — alphabetically — which in
 * this repo means `cli` (which depends on orchestrator, server, shared and testing) compiles FIRST
 * and `testing` (which twelve packages depend on) compiles TENTH. Against a warm `dist/` nobody
 * notices; against a COLD tree every package that sorts before its own dependencies cannot resolve
 * its `@dungeonmaster/*` imports — nothing has written the `dist/` those types come from yet — and
 * each of those cascades into the `{}`-fallback errors (TS2339 / TS7006 / TS2322) that follow from
 * an unresolved cross-package import. A fresh riftcarver worktree is the one place this repo
 * reliably builds cold, which is why the carve log was the only place the bug was visible.
 *
 * `tsc -b` cannot take the ordering over: build mode needs `composite: true` and a `references`
 * graph, and no config in this repo carries either — `composite` forbids a project from compiling
 * a file its own `exclude` list drops, which is fatal here because several packages export their
 * `*.stub.ts` / `*.proxy.ts` files as public API from a barrel the build config excludes. Build
 * mode would also skip the non-tsc build steps (cli's esbuild bundle, mcp's statics copy, the
 * chmod postbuilds, web's vite build). So this script keeps each package's OWN build script and
 * only fixes the order they run in.
 *
 * The order is DERIVED from each package.json's `@dungeonmaster/*` dependencies on every run — a
 * hardcoded list would silently skip a package added later, which is worse than building it in the
 * wrong order.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmdirSync, unlinkSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const PACKAGES_DIR = 'packages';
const SCOPE = '@dungeonmaster/';
const BUILD_CONFIG_NAME = 'tsconfig.build.json';

// A refusal exists to be read, so it lists enough paths to show WHERE the mapping went wrong — the
// full inventory of a 684-file dist would bury the two lines above it that name rootDir and outDir.
const REFUSAL_SAMPLE_LIMIT = 20;

/**
 * PRUNE_DIST modes:
 *   unset      build every package, then prune its stale emit
 *   'report'   build nothing, delete nothing, print what a prune would remove
 *   'only'     build nothing, prune
 */
const PRUNE_MODE = process.env.PRUNE_DIST ?? '';
const PRUNE_REPORT_ONLY = PRUNE_MODE === 'report';
const SKIP_BUILD = PRUNE_REPORT_ONLY || PRUNE_MODE === 'only';

// `tsc` only ever ADDS to outDir. A renamed or deleted source leaves its emitted `.js` / `.d.ts` /
// `.d.ts.map` behind forever, and that is not cosmetic: ward's typecheck spawns `tsc --noEmit` with
// no source condition, so hundreds of cross-package imports resolve to `dist` declarations — a stale
// declaration lets typecheck PASS against code whose source is gone. cli's package discovery is
// worse still: it probes fixed `start-install.js` paths and EXECUTES the first hit, so a stale
// installer would run against a consumer's repo.
const EMITTED_EXTENSIONS = ['.d.ts.map', '.d.ts', '.js.map', '.js'];

// `allowJs` is on repo-wide, so a `.jsx` beside an emitted `.js` is a real source and that output is
// NOT stale — leaving it out deletes live emit. `.mts` / `.cts` are deliberately absent: they emit
// `.mjs` / `.cjs` / `.d.mts` / `.d.cts`, none of which are in EMITTED_EXTENSIONS, so that output is
// never a delete candidate to begin with. Adding them here could only un-flag a `.js` no `.mts` can
// produce. If `.mjs` / `.d.mts` are ever added above, add `.mts` / `.cts` here in the same change.
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json'];

// Emitted files that legitimately have no source of their own, keyed by package directory and listed
// as outDir-relative posix paths. cli's bin is the esbuild bundle its `postbuild` writes.
const PRUNE_KEEP = new Map([['cli', new Set(['bin/dungeonmaster.js'])]]);

const collectFiles = ({ dir }) => {
  const files = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectFiles({ dir: full }));
      continue;
    }

    if (entry.isFile()) {
      files.push(full);
    }
  }

  return files;
};

const removeEmptyDirectories = ({ dir }) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      removeEmptyDirectories({ dir: join(dir, entry.name) });
    }
  }

  if (readdirSync(dir).length === 0) {
    rmdirSync(dir);
  }
};

/**
 * Reads the one config the prune maps emit through. Everything past "this package has no tsc build"
 * is reported as `invalid` rather than swallowed: a build config this cannot read silently disables
 * pruning for that package forever, and the default build mode prints nothing at all on a zero, so
 * the disabling is invisible until a stale `start-install.js` executes in a consumer's repo.
 */
const readPruneConfig = ({ packageDir }) => {
  const configPath = join(packageDir, BUILD_CONFIG_NAME);

  if (!existsSync(configPath)) {
    // No tsc build to prune — web builds with vite, which clears its own outDir.
    return { kind: 'skip', reason: 'no tsc outDir to prune' };
  }

  let config;

  try {
    config = JSON.parse(readFileSync(configPath, 'utf8'));
  } catch (error) {
    return {
      kind: 'invalid',
      configPath,
      message: `cannot be read as JSON: ${error.message}`,
      hint: 'tsc accepts JSONC; this prune parses strict JSON — no comments, no trailing commas.',
    };
  }

  const { rootDir, outDir } = config.compilerOptions ?? {};

  if (typeof rootDir !== 'string' || typeof outDir !== 'string') {
    return {
      kind: 'invalid',
      configPath,
      message: `compilerOptions.rootDir and compilerOptions.outDir must both be strings (rootDir: ${JSON.stringify(rootDir)}, outDir: ${JSON.stringify(outDir)})`,
      hint: '`extends` is not resolved here, and a guessed default would map the emit at the wrong depth — inline both.',
    };
  }

  return { kind: 'config', rootDir, outDir };
};

/**
 * Returns the emitted files under the package's outDir that no longer have a source behind them,
 * and — unless `dryRun` — deletes them plus any directory they emptied.
 *
 * The predicate is source-existence ON DISK, mapped stem-for-stem through rootDir. It is deliberately
 * NOT `ts.parseJsonConfigFileContent(...).fileNames`: `exclude` only prunes the wildcard-discovered
 * set, and tsc still emits an excluded file that a non-excluded file imports. Seven packages export
 * their `*.proxy.ts` / `*.stub.ts` as public API exactly that way, so a config-derived expected-set
 * would delete real output.
 */
const pruneStaleEmit = ({ dirName, dryRun }) => {
  const packageDir = resolve(PACKAGES_DIR, dirName);
  const config = readPruneConfig({ packageDir });

  if (config.kind !== 'config') {
    return config;
  }

  const rootPath = resolve(packageDir, config.rootDir);
  const outPath = resolve(packageDir, config.outDir);

  // outDir has to be a directory strictly BELOW the package. `.ward/build.tsbuildinfo` sits beside
  // it, and deleting that would make the next `tsc` believe the tree is current and emit nothing —
  // an empty dist at exit 0. Walking only a strict subdirectory keeps the buildinfo out of reach.
  if (!outPath.startsWith(`${packageDir}${sep}`)) {
    return { kind: 'skip', reason: `outDir ${config.outDir} is not below the package — not walked` };
  }

  if (!existsSync(outPath)) {
    return { kind: 'skip', reason: 'no tsc outDir to prune' };
  }

  const keep = PRUNE_KEEP.get(dirName) ?? new Set();
  const stale = [];
  let mapped = 0;

  for (const file of collectFiles({ dir: outPath })) {
    const relativePath = relative(outPath, file);
    const extension = EMITTED_EXTENSIONS.find((candidate) => relativePath.endsWith(candidate));

    // Only tsc's own four output extensions are ours to remove; everything else in dist was put
    // there by a postbuild step (mcp copies its folder-constraint `.md` statics in).
    if (extension === undefined || keep.has(relativePath.split(sep).join('/'))) {
      continue;
    }

    const stem = relativePath.slice(0, -extension.length);
    const hasSource = SOURCE_EXTENSIONS.some((candidate) =>
      existsSync(join(rootPath, `${stem}${candidate}`)),
    );

    if (hasSource) {
      mapped += 1;
      continue;
    }

    stale.push(file);
  }

  // A rootDir that does not describe the emit maps EVERY output to a source that cannot exist, so the
  // whole dist reads as stale and one prune erases the package — at exit 0, and with the buildinfo
  // left intact, so the next `tsc` believes the tree is current and emits nothing to replace it. A
  // rootDir that genuinely MOVED looks identical by count, and pruning every old path is then correct;
  // what separates the two is that the build has just written the relocated files, so they map. Zero
  // mapped means the mapping is broken, and this delete is not recoverable by a normal build.
  if (mapped === 0 && stale.length > 0) {
    return {
      kind: 'refused',
      rootDir: config.rootDir,
      outDir: config.outDir,
      rootPath,
      outPath,
      stale,
    };
  }

  if (!dryRun && stale.length > 0) {
    for (const file of stale) {
      unlinkSync(file);
    }

    for (const entry of readdirSync(outPath, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        removeEmptyDirectories({ dir: join(outPath, entry.name) });
      }
    }
  }

  return { kind: 'pruned', outPath, stale };
};

// Returns false when the package's prune could not be trusted. Every such path is fatal — a prune
// that cannot run is how a whole dist disappears at exit 0.
const reportPrune = ({ name, dirName }) => {
  const result = pruneStaleEmit({ dirName, dryRun: PRUNE_REPORT_ONLY });

  if (result.kind === 'skip') {
    if (PRUNE_REPORT_ONLY) {
      process.stdout.write(`${name}: ${result.reason}\n`);
    }
    return true;
  }

  if (result.kind === 'invalid') {
    process.stderr.write(
      `\nprune aborted in ${name}\n` +
        `  ${relative(process.cwd(), result.configPath)} ${result.message}\n` +
        `  ${result.hint}\n`,
    );
    return false;
  }

  if (result.kind === 'refused') {
    process.stderr.write(
      `\nprune refused in ${name}: all ${String(result.stale.length)} emitted file(s) under outDir map to a\n` +
        `missing source and NONE map to an existing one, so rootDir does not describe this emit.\n` +
        `Nothing was deleted. Fix the paths below, or run \`npm run build:clean\` if the tree really is stale.\n` +
        `  rootDir: ${result.rootDir} -> ${relative(process.cwd(), result.rootPath)}\n` +
        `  outDir:  ${result.outDir} -> ${relative(process.cwd(), result.outPath)}\n` +
        `  would have deleted:\n`,
    );

    for (const file of result.stale.slice(0, REFUSAL_SAMPLE_LIMIT)) {
      process.stderr.write(`    ${relative(process.cwd(), file)}\n`);
    }

    if (result.stale.length > REFUSAL_SAMPLE_LIMIT) {
      process.stderr.write(
        `    ... and ${String(result.stale.length - REFUSAL_SAMPLE_LIMIT)} more\n`,
      );
    }

    return false;
  }

  const verb = PRUNE_REPORT_ONLY ? 'would prune' : 'pruned';

  if (result.stale.length > 0 || PRUNE_REPORT_ONLY) {
    process.stdout.write(`${verb} ${String(result.stale.length)} stale file(s) in ${name}\n`);
  }

  for (const file of result.stale) {
    process.stdout.write(`  ${relative(process.cwd(), file)}\n`);
  }

  return true;
};

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

if (SKIP_BUILD) {
  process.stdout.write(`prune ${PRUNE_MODE}: building nothing\n`);
} else {
  process.stdout.write(
    `build order: ${order.map((name) => name.slice(SCOPE.length)).join(' -> ')}\n`,
  );
}

let pruneRefused = false;

for (const name of order) {
  const { dir, hasBuild } = manifests.get(name);

  if (SKIP_BUILD) {
    // Nothing is being built, so nothing buries the refusal: survey every package before exiting,
    // otherwise a second broken config stays hidden behind the first.
    pruneRefused = !reportPrune({ name, dirName: dir }) || pruneRefused;
    continue;
  }

  if (!hasBuild) {
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

  // AFTER the whole build, `postbuild` included — cli's esbuild bundle and mcp's statics copy both
  // land in dist during postbuild, so a prune ahead of them would delete their output.
  if (!reportPrune({ name, dirName: dir })) {
    process.exit(1);
  }
}

if (pruneRefused) {
  process.exit(1);
}
