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

const checkDevDependencies = ({ report, consumerRoot, gt }) => {
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

  const missingInstalled = expectedNames.filter(
    (name) => !existsSync(join(consumerRoot, 'node_modules', ...name.split('/'))),
  );
  report.check(
    'every devDependenciesStatics package actually resolves in node_modules',
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
    'every devDependenciesStatics @dungeonmaster/* package carries publishConfig.access "public" (a real install 404s otherwise)',
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
const checkJestConfigBaseMsw = ({ report, consumerRoot }) => {
  const jestConfigBasePath = join(
    consumerRoot,
    'node_modules',
    '@dungeonmaster',
    'testing',
    'jest-config-base.js',
  );
  if (!existsSync(jestConfigBasePath)) {
    report.check('@dungeonmaster/testing/jest-config-base.js is installed', false, jestConfigBasePath);
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
    "jest-config-base.js's transformIgnorePatterns lets msw|@mswjs|until-async|outvariant through",
    transformIgnoreMatchesMsw,
    JSON.stringify(config.transformIgnorePatterns),
  );
  const loadsEndpointMockSetup = (config.setupFilesAfterEnv ?? []).some((entry) =>
    entry.endsWith(join('startup', 'start-endpoint-mock-setup.ts')),
  );
  report.check(
    "jest-config-base.js's setupFilesAfterEnv loads start-endpoint-mock-setup.ts",
    loadsEndpointMockSetup,
    JSON.stringify(config.setupFilesAfterEnv),
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
      JSON.stringify(exportKeys) === JSON.stringify(['./*', './*.proxy', './*.stub'].sort());
    const ownSourceCondition = `${folder}-own-source`;
    const carriesOwnSourceCondition = ['./*', './*.proxy', './*.stub'].every((key) =>
      Object.prototype.hasOwnProperty.call(manifest.exports?.[key] ?? {}, ownSourceCondition),
    );
    const noTestKey = !Object.keys(manifest.exports ?? {}).some((key) => key.includes('_test_'));
    report.check(
      `packages/@gateway/${folder}'s package.json exports exactly ./*.proxy, ./*.stub, ./* with the ${ownSourceCondition} condition and no _test_ key`,
      hasExactThreeKeys && carriesOwnSourceCondition && noTestKey,
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

  // `scope` is read from the REAL scaffolded `packages/@gateway/node/package.json`'s own `name`
  // (this suite's `run.mjs` derives it there and passes it in) rather than assumed here —
  // `gatewayScopeDetectTransformer` derives it from the root package.json's own `name` (falling back
  // to the target directory's basename), which may or may not land on `@dungeonmaster` for THIS
  // fixture; asserting against a guessed literal here would silently pass for the wrong reason
  // either way.
  const expectedImports = gt.gatewayImportsFieldTransformer({ scope: scope ?? '@dungeonmaster' });

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
  checkDevDependencies({ report, consumerRoot, gt });
  checkJestConfigBaseMsw({ report, consumerRoot });
  checkRootTsconfig({ report, consumerRoot });
  checkEslintConfig({ report, consumerRoot });
  checkDungeonmasterConfig({ report, consumerRoot, gt });
  checkGatewayPackages({ report, consumerRoot, gt });
  // A no-op here when no `packages/*` exist yet (a bare consumer, before this suite's own fixture
  // packages are scaffolded) — `run.mjs` calls `checkWorkspacePackageGatewayImports` again, by
  // name, once `writeGatewayImportSources`/`scaffoldFixturePackages` has put real packages on disk,
  // which is the only point this bullet has anything to check against.
  checkWorkspacePackageGatewayImports({ report, consumerRoot, gt });
  checkWorktreesAndGitignore({ report, consumerRoot });

  if (mode === 'global') {
    // Scenario 4 (repo CLAUDE.md's "Four Resolution Scenarios") is scoped to MCP module
    // resolution, never the full package-scaffold surface — a global-only install never runs
    // `npm install` inside the bare consumer, so `node_modules` (and everything gated on it above)
    // does not exist there by design. Nothing further to assert for this mode here.
  }
};

// Re-exported so `run.mjs` can call it a second time once this suite's own fixture packages exist
// on disk (see the comment inside `runWriteAssertions` above).
export { checkWorkspacePackageGatewayImports };
