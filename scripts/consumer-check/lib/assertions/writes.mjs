/**
 * Assertions for item G27 step 3 — "what `init` writes". Each one reads a file straight off the
 * consumer's own disk and compares it against the SAME generator this repo's own compiled `dist/`
 * runs (via `ground-truth.mjs`), never a hand-typed expectation that could drift from the real
 * generator. `mode` is `'local'` or `'global'` — the global scenario only writes into a bare
 * consumer with no scaffolded `packages/*` of its own yet (repo `CLAUDE.md`'s "Four Resolution
 * Scenarios" table scopes scenario 4 to MCP resolution, not the full package-scaffold surface), so a
 * handful of checks below are local-only and say so in their own name.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

const permissionRowsFor = ({ toolNames }) => toolNames.map((name) => `mcp__dungeonmaster__${name}`);

// `requireType` is `.mcp.json`-only: the REAL generated Antigravity `mcp_config.json` carries no
// `"type"` field at all (confirmed against a real `init` run — only the Claude Code `.mcp.json`
// generator adds `"type": "stdio"`), so asserting it there is a false negative, not a stricter check.
const checkMcpConfigShape = ({ report, configPath, label, gt, requireType = true }) => {
  if (!existsSync(configPath)) {
    report.check(`${label} exists`, false, `not found at ${configPath}`);
    return;
  }
  const config = readJson(configPath);
  const server = config.mcpServers?.dungeonmaster;
  report.check(
    `${label}: mcpServers.dungeonmaster is a node entry running the real resolveScript`,
    (!requireType || server?.type === 'stdio') &&
      server?.command === 'node' &&
      Array.isArray(server?.args) &&
      server.args[0] === '-e' &&
      server.args[1] === gt.mcpServerStatics.resolveScript,
    server ? '' : JSON.stringify(config),
  );
};

const checkClaudeSettingsHooks = ({ report, consumerRoot, gt }) => {
  const settingsPath = join(consumerRoot, '.claude', 'settings.json');
  if (!existsSync(settingsPath)) {
    report.check('.claude/settings.json exists', false, `not found at ${settingsPath}`);
    return;
  }
  const settings = readJson(settingsPath);
  const expectedHooks = gt.dungeonmasterHooksCreatorTransformer();

  const hookCommandSet = (hookGroup) =>
    (hookGroup ?? [])
      .flatMap((entry) => entry.hooks ?? [])
      .map((hook) => hook.command)
      .sort();

  for (const hookName of ['PreToolUse', 'SessionStart', 'SubagentStart', 'SubagentStop', 'WorktreeCreate']) {
    const actual = hookCommandSet(settings.hooks?.[hookName]);
    const expected = hookCommandSet(expectedHooks[hookName]);
    report.check(
      `.claude/settings.json hooks.${hookName} matches the real hooks generator`,
      JSON.stringify(actual) === JSON.stringify(expected),
      actual.length === expected.length ? '' : `got ${actual.length}, expected ${expected.length}`,
    );
  }

  const allow = settings.permissions?.allow ?? [];
  const expectedRows = permissionRowsFor({ toolNames: gt.mcpToolsStatics.tools.names });
  const missing = expectedRows.filter((row) => !allow.includes(row));
  report.check(
    '.claude/settings.json permissions.allow carries every mcp__dungeonmaster__<tool> row',
    missing.length === 0,
    missing.length === 0 ? '' : `missing: ${missing.join(', ')}`,
  );
};

const checkDevDependencies = ({ report, consumerRoot, gt, mode }) => {
  const packageJsonPath = join(consumerRoot, 'package.json');
  const packageJson = readJson(packageJsonPath);
  const expectedNames = Object.keys(gt.devDependenciesStatics.packages);
  const declared = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const missingDeclared = expectedNames.filter((name) => declared[name] === undefined);
  report.check(
    "root package.json declares every devDependenciesStatics package (dependencies OR devDependencies, since this suite's own root dependencies already carry the @dungeonmaster/* ones as file: tarballs)",
    missingDeclared.length === 0,
    missingDeclared.length === 0 ? '' : `missing: ${missingDeclared.join(', ')}`,
  );

  // Scenario 4 (repo CLAUDE.md's "Four Resolution Scenarios") never runs `npm install` inside the
  // bare consumer — `run.mjs`'s `runGlobalMode` only installs the tarballs into a separate, FAKE
  // global prefix (`global-prefix.mjs`), never into `consumerRoot` itself — so `consumerRoot`'s own
  // `node_modules` never exists in global mode, by this suite's own design, not by regression. The
  // two checks below would fail every global run for that reason alone, so they run in local mode
  // only, exactly as this file's own header already promises.
  if (mode === 'global') {
    return;
  }

  const missingInstalled = expectedNames.filter(
    (name) => !existsSync(join(consumerRoot, 'node_modules', ...name.split('/'))),
  );
  report.check(
    'every devDependenciesStatics package actually resolves in node_modules (local mode only)',
    missingInstalled.length === 0,
    missingInstalled.length === 0 ? '' : `missing: ${missingInstalled.join(', ')}`,
  );

  const publishConfigGaps = expectedNames
    .filter((name) => name.startsWith('@dungeonmaster/'))
    .filter((name) => {
      const manifestPath = join(consumerRoot, 'node_modules', ...name.split('/'), 'package.json');
      if (!existsSync(manifestPath)) return false;
      const manifest = readJson(manifestPath);
      return manifest.publishConfig?.access !== 'public';
    });
  report.check(
    'every devDependenciesStatics @dungeonmaster/* package carries publishConfig.access "public" (a real install 404s otherwise) (local mode only)',
    publishConfigGaps.length === 0,
    publishConfigGaps.length === 0 ? '' : `missing publishConfig.access: ${publishConfigGaps.join(', ')}`,
  );
};

// T01 (gateway-pivot 02176f3c5): MSW loads through the published jest base in every consumer
// package, not just this repo's own `jest.config.base.js`. Two things have to be true of the
// INSTALLED `@dungeonmaster/testing/jest-config-base.js` for that to hold in a real consumer
// install (no workspace symlink — msw ships ESM-only `.js` with no CJS build, hoisted to the
// consumer's own top-level `node_modules`, never nested under `@dungeonmaster/testing`):
// `transformIgnorePatterns` must still transform msw's own files, and `setupFilesAfterEnv` must
// load `start-endpoint-mock-setup.ts` (never opt-in — a consumer package gets this for free).
const checkJestConfigBaseMsw = ({ report, consumerRoot, mode }) => {
  // Local mode only, same reason as checkDevDependencies's own node_modules-dependent checks above:
  // global mode never installs anything into consumerRoot, so @dungeonmaster/testing never resolves
  // there at all.
  if (mode === 'global') {
    return;
  }

  const jestConfigBasePath = join(
    consumerRoot,
    'node_modules',
    '@dungeonmaster',
    'testing',
    'jest-config-base.js',
  );
  if (!existsSync(jestConfigBasePath)) {
    report.check(
      '@dungeonmaster/testing/jest-config-base.js is installed (local mode only)',
      false,
      jestConfigBasePath,
    );
    return;
  }
  const require_ = createRequire(join(consumerRoot, 'package.json'));
  const config = require_(jestConfigBasePath);
  // A `transformIgnorePatterns` entry names paths jest SKIPS transforming — so "msw gets
  // transformed" means NONE of the entries match an msw path, not that one does.
  const mswPath = '/node_modules/msw/lib/index.mjs';
  const transformIgnoreMatchesMsw = (config.transformIgnorePatterns ?? []).every(
    (pattern) => !new RegExp(pattern, 'u').test(mswPath),
  );
  report.check(
    "jest-config-base.js's transformIgnorePatterns lets msw|@mswjs|until-async|outvariant through (local mode only)",
    transformIgnoreMatchesMsw,
    JSON.stringify(config.transformIgnorePatterns),
  );
  // The COMPILED `dist` file, not `.ts` source: every caller reaches `StartEndpointMock` through
  // this package's `.` export, which resolves to `dist/` here (no `source` condition — F-shape bug
  // found against a real packed-and-installed consumer: a `src/` setup file gets its own, separate
  // `mswServerAdapter()` singleton, so `server.listen()` intercepts on a server with no handlers and
  // every staged response bypasses to a real, unanswered network call).
  const loadsEndpointMockSetup = (config.setupFilesAfterEnv ?? []).some((entry) =>
    entry.endsWith(join('dist', 'src', 'startup', 'start-endpoint-mock-setup.js')),
  );
  report.check(
    "jest-config-base.js's setupFilesAfterEnv loads the compiled start-endpoint-mock-setup.js, not the .ts source (local mode only)",
    loadsEndpointMockSetup,
    JSON.stringify(config.setupFilesAfterEnv),
  );

  // F14 (gateway-pivot): an unanchored `.js` transform key silently repairs a genuine syntax error
  // in a CONSUMER's own project `.js` file via ts-jest's error-recovering `transpileModule` — the
  // same class of bug `@gateway/node`'s `dynamic-import.test.ts` caught for this repo's own
  // packages (fixed in cdf22d643). `transformIgnorePatterns` stays `[]` here on purpose (msw's own
  // transitive ESM graph is too deep to enumerate by name — see this file's own header), so the
  // `transform` regex itself is the only thing standing between a consumer's own `.js` fixture and
  // ts-jest. Every `transform` key must therefore either match ONLY `.ts`/`.tsx` (own source,
  // anywhere) or be anchored to a path containing `/node_modules/` — never a bare `.js`/`.mjs`/`.cjs`
  // match with no anchor.
  const consumerOwnJsPath = join(consumerRoot, 'src', 'fixtures', 'broken-syntax.js');
  const nodeModulesEsmPath = join(consumerRoot, 'node_modules', 'msw', 'lib', 'node', 'index.js');
  const transformEntries = Object.entries(config.transform ?? {});
  const consumerOwnJsUntouched = transformEntries.every(
    ([pattern]) => !new RegExp(pattern, 'u').test(consumerOwnJsPath),
  );
  const nodeModulesEsmStillTransformed = transformEntries.some(([pattern]) =>
    new RegExp(pattern, 'u').test(nodeModulesEsmPath),
  );
  report.check(
    "jest-config-base.js's transform anchors every .js/.mjs/.cjs entry to node_modules, so a consumer's own project .js fixture is never routed through ts-jest (local mode only)",
    consumerOwnJsUntouched,
    JSON.stringify(Object.keys(config.transform ?? {})),
  );
  report.check(
    "jest-config-base.js's transform still transforms msw's own node_modules .js (local mode only)",
    nodeModulesEsmStillTransformed,
    JSON.stringify(Object.keys(config.transform ?? {})),
  );
};

const checkRootTsconfig = ({ report, consumerRoot }) => {
  const tsconfigPath = join(consumerRoot, 'tsconfig.json');
  if (!existsSync(tsconfigPath)) {
    report.check('root tsconfig.json exists', false, `not found at ${tsconfigPath}`);
    return;
  }
  const tsconfig = readJson(tsconfigPath);
  report.check(
    'root tsconfig.json extends the published base with node16 + the source condition',
    tsconfig.extends === '@dungeonmaster/eslint-plugin/tsconfig' &&
      tsconfig.compilerOptions?.moduleResolution === 'node16' &&
      Array.isArray(tsconfig.compilerOptions?.customConditions) &&
      tsconfig.compilerOptions.customConditions.includes('source'),
    JSON.stringify(tsconfig.compilerOptions),
  );
};

const checkEslintConfig = ({ report, consumerRoot }) => {
  const eslintConfigPath = join(consumerRoot, 'eslint.config.js');
  if (!existsSync(eslintConfigPath)) {
    report.check('eslint.config.js exists', false, `not found at ${eslintConfigPath}`);
    return;
  }
  const contents = readFileSync(eslintConfigPath, 'utf8');
  report.check(
    'eslint.config.js loads the dungeonmaster plugin and the gateway carve-out',
    contents.includes("require('@dungeonmaster/eslint-plugin')") &&
      contents.includes('gatewayLocationsStatics'),
    '',
  );
};

const checkDungeonmasterConfig = ({ report, consumerRoot, gt }) => {
  const configPath = join(consumerRoot, '.dungeonmaster.json');
  if (!existsSync(configPath)) {
    report.check('.dungeonmaster.json exists', false, `not found at ${configPath}`);
    return;
  }
  const config = readJson(configPath);
  const parsed = gt.dungeonmasterConfigContract.safeParse(config);
  report.check(
    '.dungeonmaster.json validates against dungeonmasterConfigContract',
    parsed.success,
    parsed.success ? '' : JSON.stringify(parsed.error?.issues ?? parsed.error),
  );
  report.check(
    '.dungeonmaster.json carries the gateway key',
    config.gateway !== undefined,
    config.gateway === undefined ? 'no "gateway" key present' : '',
  );
};

const checkGatewayPackages = ({ report, consumerRoot, gt }) => {
  const gatewayDir = join(consumerRoot, 'packages', '@gateway');
  for (const folder of Object.values(gt.gatewayLocationsStatics.folders)) {
    const packageDir = join(gatewayDir, folder);
    const packageJsonPath = join(packageDir, 'package.json');
    if (!existsSync(packageJsonPath)) {
      report.check(`packages/@gateway/${folder} is scaffolded`, false, `no package.json at ${packageJsonPath}`);
      continue;
    }
    const manifest = readJson(packageJsonPath);
    const exportKeys = Object.keys(manifest.exports ?? {}).sort();
    const hasExactThreeKeys =
      JSON.stringify(exportKeys) ===
      JSON.stringify(['./package.json', './*', './*.proxy', './*.stub'].sort());
    const ownSourceCondition = `${folder}-own-source`;
    const carriesOwnSourceCondition = ['./*', './*.proxy', './*.stub'].every((key) =>
      Object.prototype.hasOwnProperty.call(manifest.exports?.[key] ?? {}, ownSourceCondition),
    );
    const noTestKey = !Object.keys(manifest.exports ?? {}).some((key) => key.includes('_test_'));
    const exposesManifest = manifest.exports?.['./package.json'] === './package.json';
    report.check(
      `packages/@gateway/${folder}'s package.json exports exactly ./package.json, ./*.proxy, ./*.stub, ./* with the ${ownSourceCondition} condition and no _test_ key`,
      hasExactThreeKeys && carriesOwnSourceCondition && noTestKey && exposesManifest,
      JSON.stringify(exportKeys),
    );

    const isCopiedFolder = Object.hasOwn(gt.gatewaySourceCopyStatics.sources, folder);
    const srcDir = join(packageDir, 'src');
    const hasRealSource =
      existsSync(srcDir) && readdirSync(srcDir).length > 0;
    report.check(
      `packages/@gateway/${folder} ${isCopiedFolder ? 'holds copied dungeonmaster source' : 'starts as an empty placeholder'}`,
      isCopiedFolder ? hasRealSource : true,
      '',
    );
  }
};

// The scope every scaffolded package's `#gateway/*` imports field must agree with, read straight
// off the REAL `packages/@gateway/node/package.json`'s own `name` (never assumed) — the same
// package `dungeonmaster init`'s gateway step scaffolded and named with
// `workspaceScopeFromRootNameTransformer`. Returns `null` when that package does not exist yet (a
// bare consumer `init` has not touched), so a caller can fall back to skipping the check rather
// than asserting against a guess that would silently pass or fail for the wrong reason.
const detectGatewayScope = ({ consumerRoot }) => {
  const nodePkgPath = join(consumerRoot, 'packages', '@gateway', 'node', 'package.json');
  if (!existsSync(nodePkgPath)) {
    return null;
  }
  const nodePkg = readJson(nodePkgPath);
  const suffix = '/node';
  return typeof nodePkg.name === 'string' && nodePkg.name.endsWith(suffix)
    ? nodePkg.name.slice(0, -suffix.length)
    : null;
};

// Only actual `packages/*` entries get the `imports` merge (`install-setup-gateway-responder`
// walks `gatewayExistingPackagesListBroker({ packagesDir })`, which is `packages/`, never the
// workspaces ROOT package.json — that file has no `imports` field of its own to merge into).
// Discovered dynamically rather than by a hardcoded fixture package name, so this keeps working
// whatever this suite's own fixture packages end up being named.
const checkWorkspacePackageGatewayImports = ({ report, consumerRoot, gt, scope }) => {
  const packagesDir = join(consumerRoot, 'packages');
  if (!existsSync(packagesDir)) {
    return;
  }
  const packageDirNames = readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== '@gateway')
    .map((entry) => entry.name);

  // No-op in global mode (repo CLAUDE.md's scenario 4 scaffolds no `packages/*` of its own —
  // `packagesDir` exists but is empty) and in any run where `init` has not yet scaffolded a single
  // package to check. Only past this point does anything need a scope to compare against.
  if (packageDirNames.length === 0) {
    return;
  }

  // `scope`, when the caller passes one (`run.mjs` does, once this suite's own fixture packages
  // exist), wins. Otherwise this detects the REAL scope itself off `packages/@gateway/node/`,
  // which already exists by the time `runWriteAssertions` calls this with no `scope` — `init`
  // scaffolds the gateway packages and `hydration-recipes` in the same pass. A hardcoded guess here
  // would silently disagree with whatever this suite's own fixture root package.json is actually
  // named.
  const resolvedScope = scope ?? detectGatewayScope({ consumerRoot });
  if (resolvedScope === null) {
    report.check(
      'packages/*/package.json #gateway/* imports match the real scaffolded gateway scope',
      false,
      'packages/@gateway/node/package.json is missing or unnamed — cannot detect the real scope',
    );
    return;
  }
  const expectedImports = gt.gatewayImportsFieldTransformer({ scope: resolvedScope });

  for (const dirName of packageDirNames) {
    const packageJsonPath = join(packagesDir, dirName, 'package.json');
    if (!existsSync(packageJsonPath)) continue;
    const manifest = readJson(packageJsonPath);
    const actualImports = manifest.imports ?? {};
    const missing = Object.keys(expectedImports).filter(
      (key) => actualImports[key] !== expectedImports[key],
    );
    report.check(
      `packages/${dirName}/package.json maps every #gateway/<kind>/* import`,
      missing.length === 0,
      missing.length === 0 ? '' : `wrong/missing: ${missing.join(', ')}`,
    );
  }
};

const checkWorktreesAndGitignore = ({ report, consumerRoot }) => {
  report.check(
    'worktrees/ directory exists',
    existsSync(join(consumerRoot, 'worktrees')),
    '',
  );
  const gitignore = existsSync(join(consumerRoot, '.gitignore'))
    ? readFileSync(join(consumerRoot, '.gitignore'), 'utf8')
    : '';
  const mustContain = ['worktrees/', '.quest-plans/', '.dungeonmaster-assets/siegelense-assets'];
  const missing = mustContain.filter((line) => !gitignore.includes(line));
  report.check(
    '.gitignore carries worktrees/, .quest-plans/ and .dungeonmaster-assets/siegelense-assets (never a bare .dungeonmaster-assets/)',
    missing.length === 0 && !gitignore.split('\n').some((line) => line.trim() === '.dungeonmaster-assets/'),
    missing.length === 0 ? '' : `missing: ${missing.join(', ')}`,
  );
};

export const runWriteAssertions = ({ report, consumerRoot, gt, mode }) => {
  checkMcpConfigShape({
    report,
    configPath: join(consumerRoot, '.mcp.json'),
    label: '.mcp.json',
    gt,
  });
  checkMcpConfigShape({
    report,
    configPath: join(consumerRoot, '.agents', 'plugins', 'dungeonmaster', 'mcp_config.json'),
    label: 'Antigravity mcp_config.json',
    gt,
    requireType: false,
  });
  checkClaudeSettingsHooks({ report, consumerRoot, gt });
  checkDevDependencies({ report, consumerRoot, gt, mode });
  checkJestConfigBaseMsw({ report, consumerRoot, mode });
  checkRootTsconfig({ report, consumerRoot });
  checkEslintConfig({ report, consumerRoot });
  checkDungeonmasterConfig({ report, consumerRoot, gt });
  checkGatewayPackages({ report, consumerRoot, gt });
  // Already checks something real here in local mode: `init` scaffolds `packages/@gateway/*` AND
  // `packages/hydration-recipes` in the same pass, so both exist by now, and this call detects the
  // real scope itself off disk (no `scope` argument, so `checkWorkspacePackageGatewayImports`'s own
  // fallback runs). A no-op only in global mode, where scenario 4 scaffolds no `packages/*` of its
  // own. `run.mjs` calls `checkWorkspacePackageGatewayImports` again, by name, once
  // `scaffoldFixturePackages` has put this suite's OWN fixture packages on disk too.
  checkWorkspacePackageGatewayImports({ report, consumerRoot, gt });
  checkWorktreesAndGitignore({ report, consumerRoot });
};

// Re-exported so `run.mjs` can call it a second time once this suite's own fixture packages exist
// on disk (see the comment inside `runWriteAssertions` above).
export { checkWorkspacePackageGatewayImports };
