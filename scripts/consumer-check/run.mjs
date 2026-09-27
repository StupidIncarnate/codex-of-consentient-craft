#!/usr/bin/env node
/**
 * `npm run check:consumer` — builds a fresh, real consumer repo under the OS `/tmp`, installs the
 * packed tarballs of every published dungeonmaster package, runs `dungeonmaster init` the way a
 * real user would, and asserts both what `init` wrote and that the result actually works
 * (typecheck, lint, the copied gateways' own tests, the I/O trap, a mocked gateway proxy test, the
 * consumer's own build, the MCP server, `dungeonmaster ward`, the pre-edit hook, and idempotent
 * re-init).
 *
 * PREREQUISITE: run `npm run build:clean` first (like `scripts/check-published-output.mjs` — this
 * script packs `dist/`, so a stale or absent build silently packs last build's output or nothing).
 *
 * WHY THIS LIVES OUTSIDE `packages/`, NOT AS A WORKSPACE PACKAGE: G27's item file recommends a
 * private workspace package (`packages/consumer-check`) whose tests carry a name ward's own
 * discovery would skip. Ward's actual discovery (read directly out of
 * `packages/ward/src/brokers/workspace/discover/**`) auto-scans EVERY directory under the root
 * `package.json`'s `workspaces` globs that has a `package.json` with a `name` field AND a `src/`
 * directory — there is no `private: true` exemption and no per-file naming exemption; a file counts
 * as unit/integration/e2e purely by whether its name ends `.test.ts`/`.integration.test.ts`/
 * `.e2e.test.ts`. A package holding this suite's slow, real-network, dist-reading run would need a
 * `src/` directory to get ward's lint+typecheck coverage on its OWN source, and that SAME `src/`
 * directory is what makes ward auto-discover and try to run anything inside it as a normal package —
 * the two goals ("ward checks the suite's own source" and "ward never runs the suite itself")
 * cannot both be had inside a workspace package gated on a single `src/`-or-not boolean. `scripts/**`
 * is already the repo's proven escape hatch for exactly this shape of tooling —
 * `scripts/check-published-output.mjs`'s own header notes ward already skips it entirely because
 * `scripts/**` sits in `eslint.config.js`'s global `ignores` and belongs to no workspace package.
 * This suite follows that precedent instead of the item's recommendation (see the agent's report,
 * DECISIONS, for the full reasoning and the trade-off it accepts: no ward lint/typecheck coverage
 * on this suite's own source, reviewed by hand instead).
 *
 * Usage: node scripts/consumer-check/run.mjs [--mode=local|global|all] [--keep]
 *   --mode   which install scenario(s) to run (repo CLAUDE.md's "Four Resolution Scenarios",
 *            3 = local node_modules, 4 = global install only). Default: all.
 *   --keep   never delete the consumer directories, even on a full pass (default: delete on pass,
 *            always keep and print the path on any failure).
 */

import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

import { loadGroundTruth } from './lib/ground-truth.mjs';
import { packAllPackages } from './lib/pack.mjs';
import { makeWorkDir, npmInstall, writeRootPackageJson } from './lib/fixture.mjs';
import { runDungeonmasterInit } from './lib/bin-run.mjs';
import { envWithGlobalPrefix, globalDungeonmasterBin, installTarballsGlobally } from './lib/global-prefix.mjs';
import { run } from './lib/proc.mjs';
import { createReport, printSummary } from './lib/report.mjs';
import { runWriteAssertions, checkWorkspacePackageGatewayImports } from './lib/assertions/writes.mjs';
import { runWorksAssertions } from './lib/assertions/works.mjs';
import { runMcpResolutionAssertion } from './lib/assertions/mcp-resolution.mjs';

const args = process.argv.slice(2);
const modeArg = args.find((arg) => arg.startsWith('--mode='));
const mode = modeArg ? modeArg.slice('--mode='.length) : 'all';
const keep = args.includes('--keep');

const CONSUMER_NAME = 'acme-consumer';

// The real scope `install-setup-gateway-responder` scaffolded the four `@gateway/*` packages
// under, read back off disk — never assumed. `packages/@gateway/node/package.json`'s own `name`
// is `<scope>/node`; stripping the known `/node` suffix recovers `<scope>` exactly, whatever
// `workspaceScopeFromRootNameTransformer` decided for THIS consumer's own root package.json.
const detectScope = ({ consumerRoot }) => {
  const nodePkgPath = join(consumerRoot, 'packages', '@gateway', 'node', 'package.json');
  if (!existsSync(nodePkgPath)) {
    return null;
  }
  const nodePkg = JSON.parse(readFileSync(nodePkgPath, 'utf8'));
  const suffix = '/node';
  return typeof nodePkg.name === 'string' && nodePkg.name.endsWith(suffix)
    ? nodePkg.name.slice(0, -suffix.length)
    : null;
};

const runLocalMode = async ({ tarballs, gt }) => {
  const report = createReport({ sectionName: 'local mode (scenario 3: local node_modules)' });
  const consumerRoot = makeWorkDir({ prefix: 'dm-consumer-check-local' });
  process.stdout.write(`\n--- local mode: ${consumerRoot} ---\n`);

  writeRootPackageJson({ dir: consumerRoot, name: CONSUMER_NAME, tarballs });

  const installResult = await npmInstall({ cwd: consumerRoot });
  report.check(
    'npm install succeeds in the consumer',
    installResult.code === 0,
    installResult.code === 0 ? '' : installResult.stderr.slice(-2000),
  );
  if (installResult.code !== 0) {
    return { report, consumerRoot, fatal: true };
  }

  const initResult = await runDungeonmasterInit({ consumerRoot });
  report.check(
    'dungeonmaster init discovers and runs every package StartInstall',
    initResult.code === 0,
    initResult.code === 0
      ? initResult.stdout.slice(-500)
      : `${initResult.stdout}\n${initResult.stderr}`.slice(-3000),
  );
  if (initResult.code !== 0) {
    return { report, consumerRoot, fatal: true };
  }

  // `dungeonmaster init` (InstallAddDevDepsResponder) only WRITES the new devDependency entries
  // into package.json — it never runs `npm install` itself, the same gap F7 found for
  // create-package's own scaffolded dependencies. Without this, every devDependenciesStatics
  // package (jest, prettier, ts-jest, @types/*, ...) sits in package.json but not in node_modules,
  // and the very next check below (which reads node_modules for exactly those names) fails on a
  // fresh consumer — confirmed against a real run of this suite: an isolated `npm install` of only
  // the 18 packed tarballs, with no further step, resolves none of them.
  const postInitInstallResult = await npmInstall({ cwd: consumerRoot });
  report.check(
    "npm install succeeds after dungeonmaster init adds devDependencies",
    postInitInstallResult.code === 0,
    postInitInstallResult.code === 0 ? '' : postInitInstallResult.stderr.slice(-2000),
  );
  if (postInitInstallResult.code !== 0) {
    return { report, consumerRoot, fatal: true };
  }

  runWriteAssertions({ report, consumerRoot, gt, mode: 'local' });

  // Read before the fixture packages exist (init's own gateway step already scaffolded
  // packages/@gateway/node by this point) so the fixture broker it writes can declare the right
  // gateway dependency (F1-adjacent: gateway-dependency-declared needs a real scope, not a guess).
  const scope = detectScope({ consumerRoot });
  await runWorksAssertions({ report, consumerRoot, gt, mode: 'local', scope });

  checkWorkspacePackageGatewayImports({ report, consumerRoot, gt, scope });

  await runMcpResolutionAssertion({ report, consumerRoot, gt, mode: 'local' });

  return { report, consumerRoot, fatal: false };
};

const runGlobalMode = async ({ tarballs, gt }) => {
  const report = createReport({ sectionName: 'global mode (scenario 4: global install only)' });

  const globalPrefixDir = makeWorkDir({ prefix: 'dm-consumer-check-global-prefix' });
  await installTarballsGlobally({ globalPrefixDir, tarballs });
  const env = envWithGlobalPrefix({ globalPrefixDir });

  const consumerRoot = makeWorkDir({ prefix: 'dm-consumer-check-global' });
  process.stdout.write(`\n--- global mode: ${consumerRoot} (fake global prefix ${globalPrefixDir}) ---\n`);
  mkdirSync(join(consumerRoot, 'packages'), { recursive: true });
  writeRootPackageJson({ dir: consumerRoot, name: CONSUMER_NAME, tarballs: [] });

  const initResult = await run({
    command: globalDungeonmasterBin({ globalPrefixDir }),
    args: ['init'],
    cwd: consumerRoot,
    env,
    timeoutMs: 5 * 60 * 1000,
  });
  report.check(
    'dungeonmaster init (global-only install) discovers and runs every package StartInstall',
    initResult.code === 0,
    initResult.code === 0 ? '' : `${initResult.stdout}\n${initResult.stderr}`.slice(-3000),
  );
  if (initResult.code !== 0) {
    return { report, consumerRoot, fatal: true };
  }

  runWriteAssertions({ report, consumerRoot, gt, mode: 'global' });
  await runMcpResolutionAssertion({ report, consumerRoot, gt, mode: 'global', env });

  return { report, consumerRoot, fatal: false };
};

const main = async () => {
  const gt = await loadGroundTruth();

  const packDir = makeWorkDir({ prefix: 'dm-consumer-check-tarballs' });
  process.stdout.write(`Packing every non-private workspace package into ${packDir} ...\n`);
  const tarballs = await packAllPackages({ outDir: packDir });
  process.stdout.write(`Packed ${String(tarballs.length)} packages.\n`);

  const runLocal = mode === 'all' || mode === 'local';
  const runGlobal = mode === 'all' || mode === 'global';

  const outcomes = [];
  if (runLocal) {
    outcomes.push(await runLocalMode({ tarballs, gt }));
  }
  if (runGlobal) {
    outcomes.push(await runGlobalMode({ tarballs, gt }));
  }

  const sections = outcomes.map((outcome) => outcome.report);
  const allGreen = printSummary(sections);

  for (const outcome of outcomes) {
    const failed = !outcome.report.allPassed() || outcome.fatal;
    if (failed) {
      process.stdout.write(`\nKept (failed) consumer directory: ${outcome.consumerRoot}\n`);
    } else if (!keep) {
      rmSync(outcome.consumerRoot, { recursive: true, force: true });
    } else {
      process.stdout.write(`\nKept consumer directory (--keep): ${outcome.consumerRoot}\n`);
    }
  }
  if (!keep && allGreen) {
    rmSync(packDir, { recursive: true, force: true });
  }

  process.exitCode = allGreen ? 0 : 1;
};

main().catch((error) => {
  process.stderr.write(`consumer-check crashed: ${error.stack ?? String(error)}\n`);
  process.exitCode = 1;
});
