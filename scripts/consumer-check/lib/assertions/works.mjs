/**
 * Proves the freshly-init-ed consumer actually WORKS — typecheck, lint (including a plain pass on
 * the copied `@gateway/node`, F1), `create-package`'s own scope detection and scaffolded jest config
 * (F5, F6 — plain passing assertions now that both are fixed; no patching), the copied gateways' own
 * tests, the I/O trap, a mocked gateway-proxy test, the consumer's own build, the pre-edit hook,
 * gateway-sync after an agent's `npm install <pkg>` (`gateway-sync.mjs`), and idempotent re-init — every check here shells out to the consumer's OWN installed binaries
 * (`node_modules/.bin/*`), never this checkout's compiled output.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runDungeonmasterInit, runEslint, runJest, runNpm, runTsc, runWard } from '../bin-run.mjs';
import { run } from '../proc.mjs';
import { npmInstall } from '../fixture.mjs';
import {
  assertModuleMockResolves,
  checkHandEditKept,
  handEditGeneratedWrapper,
  runAgentInstallAssertions,
} from './gateway-sync.mjs';
import {
  LIB_PACKAGE_NAME,
  WEB_PACKAGE_NAME,
  PROBE_PACKAGE_NAME,
  SEEDED_PACKAGE_NAMES,
  NO_BARREL_PACKAGE_NAMES,
  DOT_ENTRY_PACKAGE_NAMES,
  scaffoldFixturePackages,
} from '../sample-sources.mjs';

const cliBinPath = ({ consumerRoot }) => join(consumerRoot, 'node_modules', '.bin', 'dungeonmaster');

// F5 (gateway-pivot): the real, on-disk scope every scaffolded package's `#gateway/*` imports field
// must agree with — read straight off `packages/@gateway/node/package.json`'s own `name` (never
// assumed), the same package `dungeonmaster init`'s gateway step scaffolded and named with
// `workspaceScopeFromRootNameTransformer`. `create-package`'s own scope detection now reuses that
// SAME transformer, so the two are guaranteed to agree by construction; this only proves it holds
// for a real run.
const detectCorrectScope = ({ consumerRoot }) => {
  const nodePkgPath = join(consumerRoot, 'packages', '@gateway', 'node', 'package.json');
  const nodePkg = JSON.parse(readFileSync(nodePkgPath, 'utf8'));
  const suffix = '/node';
  if (typeof nodePkg.name !== 'string' || !nodePkg.name.endsWith(suffix)) {
    return null;
  }
  return nodePkg.name.slice(0, -suffix.length);
};

const assertScopeDetection = ({ report, consumerRoot, gt }) => {
  const correctScope = detectCorrectScope({ consumerRoot });
  if (correctScope === null) {
    report.check('could not detect the real gateway scope to check create-package against', false, '');
    return;
  }
  const correctImports = gt.gatewayImportsFieldTransformer({ scope: correctScope });

  for (const packageName of SEEDED_PACKAGE_NAMES) {
    const packageJsonPath = join(consumerRoot, 'packages', packageName, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const actualImports = packageJson.imports ?? {};
    const matches = JSON.stringify(actualImports) === JSON.stringify(correctImports);
    report.check(
      `create-package gave packages/${packageName} a working #gateway/* imports field (F5)`,
      matches,
      matches ? '' : `got ${JSON.stringify(actualImports)}, expected ${JSON.stringify(correctImports)}`,
    );
  }
};

// F6 (gateway-pivot): a real consumer has no repo-root `jest.config.base.js` of its own (only THIS
// checkout does), so `create-package`'s scaffolded `jest.config.js` must require the PUBLISHED
// `@dungeonmaster/testing/jest-config-base` instead of the repo-relative path this checkout's own
// packages use.
const assertJestConfigBase = ({ report, consumerRoot }) => {
  for (const packageName of SEEDED_PACKAGE_NAMES) {
    const jestConfigPath = join(consumerRoot, 'packages', packageName, 'jest.config.js');
    if (!existsSync(jestConfigPath)) {
      report.check(`packages/${packageName}/jest.config.js exists (F6)`, false, jestConfigPath);
      continue;
    }
    const content = readFileSync(jestConfigPath, 'utf8');
    const requiresPublishedBase = content.includes(
      "require('@dungeonmaster/testing/jest-config-base')",
    );
    report.check(
      `create-package gave packages/${packageName} a jest.config.js requiring the published testing base (F6)`,
      requiresPublishedBase,
      requiresPublishedBase ? '' : content,
    );
  }
};

// Rule 13 (EPIC.md): every scaffolded package has the workspace layout and nothing else. Barrels sit
// at `src/<folderType>/<folderType>.ts`, one explicit `exports` key each (a two-star pattern breaks
// declaration emit, concession 22); `./*.proxy` and `./*.stub` carry only `source`; there is no root
// barrel, no `testing.ts` and no `./testing` key. A type with an entry (eslint-plugin, cli-tool) also
// exports `.`, and a type with no folder-type barrel (those two and hook-handlers) exports none.
const ROOT_TS_ALLOWED = new Set(['playwright.config.ts']);
const PACKAGE_JSON_SUBPATH = './package.json';
const PROXY_STUB_KEYS = ['./*.proxy', './*.stub'];

const assertScaffoldedLayout = ({ report, consumerRoot }) => {
  for (const packageName of [...SEEDED_PACKAGE_NAMES, PROBE_PACKAGE_NAME]) {
    const packageDir = join(consumerRoot, 'packages', packageName);
    const manifest = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));
    const exportsMap = manifest.exports ?? {};
    const keys = Object.keys(exportsMap);

    report.check(
      `packages/${packageName} exports ./package.json`,
      exportsMap[PACKAGE_JSON_SUBPATH] === PACKAGE_JSON_SUBPATH,
      JSON.stringify(keys),
    );

    const proxyStubSourceOnly = PROXY_STUB_KEYS.every(
      (key) =>
        JSON.stringify(exportsMap[key]) ===
        JSON.stringify({ source: `./src/${key.replace('./*.', '*.')}.ts` }),
    );
    report.check(
      `packages/${packageName} exports ./*.proxy and ./*.stub with only a source condition`,
      proxyStubSourceOnly,
      JSON.stringify(PROXY_STUB_KEYS.map((key) => exportsMap[key])),
    );

    const barrelKeys = keys.filter(
      (key) => key !== '.' && key !== PACKAGE_JSON_SUBPATH && !PROXY_STUB_KEYS.includes(key),
    );
    const barrelsAreExplicit = barrelKeys.every((key) => {
      const folderType = key.slice(2);
      return (
        !key.includes('*') &&
        exportsMap[key]?.source === `./src/${folderType}/${folderType}.ts` &&
        existsSync(join(packageDir, 'src', folderType, `${folderType}.ts`))
      );
    });
    const expectsBarrel = !NO_BARREL_PACKAGE_NAMES.includes(packageName);
    report.check(
      `packages/${packageName} has one explicit barrel key per folder type, each at src/<ft>/<ft>.ts (no ./testing, no two-star key)`,
      (expectsBarrel ? barrelKeys.length > 0 : barrelKeys.length === 0) &&
        barrelsAreExplicit &&
        !keys.includes('./testing') &&
        !keys.includes('./*'),
      JSON.stringify(barrelKeys),
    );

    const expectsDot = DOT_ENTRY_PACKAGE_NAMES.includes(packageName);
    report.check(
      `packages/${packageName} ${expectsDot ? 'exports a . entry' : 'exports no . entry'}`,
      keys.includes('.') === expectsDot,
      JSON.stringify(keys),
    );

    const strayRootFiles = readdirSync(packageDir).filter(
      (name) => /\.tsx?$/u.test(name) && !ROOT_TS_ALLOWED.has(name),
    );
    report.check(
      `packages/${packageName} has no root barrel and no testing.ts`,
      strayRootFiles.length === 0 && !existsSync(join(packageDir, 'testing.ts')),
      JSON.stringify(strayRootFiles),
    );
  }
};

const assertTypecheck = async ({ report, consumerRoot }) => {
  for (const packageName of SEEDED_PACKAGE_NAMES) {
    const cwd = join(consumerRoot, 'packages', packageName);
    const result = await runTsc({ consumerRoot, cwd });
    report.check(
      `consumer typecheck passes: packages/${packageName} (a #gateway/node import resolves)`,
      result.code === 0,
      result.code === 0 ? '' : `${result.stdout}\n${result.stderr}`.slice(-2000),
    );
  }
};

const parseEslintJson = ({ report, result, label }) => {
  try {
    return JSON.parse(result.stdout);
  } catch {
    report.check(`${label}: eslint runs and produces parseable JSON`, false, result.stderr.slice(-2000));
    return null;
  }
};

// eslint's typescript-eslint parser resolves `parserOptions.project: './tsconfig.json'` (the
// scaffolded root eslint.config.js's own setting) relative to ESLint's OWN cwd — so linting files
// from MULTIPLE packages in one invocation from the consumer ROOT makes every file outside the
// exact package whose tsconfig that path names fail to parse at all ("file was not found in any of
// the provided project(s)"). `dungeonmaster-ward` avoids this by invoking eslint separately PER
// PACKAGE; this harness does the same, matching real, working behaviour instead of a harness-only
// false alarm.
const runEslintForPackage = ({ consumerRoot, packageDir }) =>
  runEslint({ consumerRoot, cwd: packageDir, args: ['.'] });

const assertLint = async ({ report, consumerRoot, lintViolationFile }) => {
  for (const packageName of [...SEEDED_PACKAGE_NAMES, PROBE_PACKAGE_NAME]) {
    const packageDir = join(consumerRoot, 'packages', packageName);
    const result = await runEslintForPackage({ consumerRoot, packageDir });
    const eslintJson = parseEslintJson({ report, result, label: `consumer lint (packages/${packageName})` });
    if (eslintJson === null) {
      continue;
    }

    const filesWithErrors = eslintJson.filter(
      (entry) => entry.errorCount > 0 && entry.filePath !== lintViolationFile,
    );
    report.check(
      `lint passes on every file in the clean fixture (packages/${packageName})`,
      filesWithErrors.length === 0,
      filesWithErrors.length === 0
        ? ''
        : JSON.stringify(filesWithErrors.map((entry) => ({ filePath: entry.filePath, messages: entry.messages }))),
    );

    if (packageName === PROBE_PACKAGE_NAME) {
      const violatorResult = eslintJson.find((entry) => entry.filePath === lintViolationFile);
      report.check(
        'lint flags the sample file with a known violation (no-explicit-any: an `any` parameter)',
        Boolean(violatorResult && violatorResult.errorCount > 0),
        violatorResult ? `errorCount ${violatorResult.errorCount}` : 'file not present in eslint results',
      );
    }
  }
};

// F1 (EPIC.md): a real consumer's newer `@typescript-eslint` used to report `no-unused-vars` on
// five proxies and `no-deprecated` on the gateway's own `util.types.isNativeError` wrapper — both
// fixed at the source (the wrapper no longer references the deprecated symbol at all), so this is
// now a plain pass, not a known-shape classification to keep in sync by hand.
const assertGatewayNodeLintPasses = async ({ report, consumerRoot }) => {
  const packageRoot = join(consumerRoot, 'packages', '@gateway', 'node');
  const result = await runEslintForPackage({ consumerRoot, packageDir: packageRoot });
  const eslintJson = parseEslintJson({ report, result, label: 'consumer lint of @gateway/node (F1)' });
  if (eslintJson === null) {
    return;
  }
  const filesWithErrors = eslintJson.filter((entry) => entry.errorCount > 0);
  report.check(
    'consumer lint of @gateway/node passes outright (F1)',
    filesWithErrors.length === 0,
    filesWithErrors.length === 0
      ? ''
      : JSON.stringify(filesWithErrors.map((entry) => ({ filePath: entry.filePath, messages: entry.messages }))),
  );

  const typecheckAndTest = await runWard({
    consumerRoot,
    args: [
      '--only',
      'typecheck,unit,integration',
      '--',
      join('packages', '@gateway', 'node'),
      join('packages', '@gateway', 'browser'),
    ],
  });
  report.check(
    "the copied gateways' own typecheck/unit/integration checks pass in the consumer",
    typecheckAndTest.code === 0,
    typecheckAndTest.code === 0 ? '' : `${typecheckAndTest.stdout}\n${typecheckAndTest.stderr}`.slice(-3000),
  );
};

// The trap RECORDS every unstaged call and its own `afterEach` (`jest.setup-io-trap.js`) throws
// whenever that record is non-empty — independent of whether the test body's own `expect(...)
// .toThrow(...)` already "caught" it. So this is an EXPECTED-FAILING jest run, the same shape as
// `assertMswTrap` below, not a passing assertion of a throw (confirmed against a real run of this
// suite: the test's own assertion passes, then the suite's `afterEach` still fails the test).
const assertIoTrap = async ({ report, consumerRoot, ioTrapTestFile }) => {
  // Lives in `probe`, not `lib` — see sample-sources.mjs's own comment on why: a deliberately-
  // failing test in `lib`'s scope would make assertWardCleanFixture's ward sweep fail by design.
  const cwd = join(consumerRoot, 'packages', PROBE_PACKAGE_NAME);
  const result = await runJest({ consumerRoot, cwd, args: [ioTrapTestFile] });
  const output = `${result.stdout}\n${result.stderr}`;
  report.check(
    'a sample unit test making an unstaged fs call fails via the [io-trap] afterEach',
    result.code !== 0 && output.includes('[io-trap] unstaged fs.accessSync'),
    output.slice(-2000),
  );
};

// T01 (gateway-pivot 02176f3c5): unlike the I/O trap (which throws synchronously at the call
// site, so the test itself can assert the throw and PASS), MSW's unhandled-request check runs in
// `start-endpoint-mock-setup.ts`'s own `afterEach`, so the failure lands on the test as a whole —
// this is an EXPECTED-FAILING jest run, not a passing assertion of a throw.
const assertMswTrap = async ({ report, consumerRoot, mswTrapTestFile }) => {
  // Lives in `probe`, not `lib` — see sample-sources.mjs's own comment on why: a deliberately-
  // failing test in `lib`'s scope would make assertWardCleanFixture's ward sweep fail by design.
  const cwd = join(consumerRoot, 'packages', PROBE_PACKAGE_NAME);
  const result = await runJest({ consumerRoot, cwd, args: [mswTrapTestFile] });
  const output = `${result.stdout}\n${result.stderr}`;
  report.check(
    'a sample test making an unstaged fetch() call fails via MSW\'s unhandled-request afterEach',
    result.code !== 0 && output.includes('Test made a request or WebSocket connection that nothing staged'),
    output.slice(-2000),
  );
};

const assertGatewayProxyMockTest = async ({ report, consumerRoot }) => {
  const cwd = join(consumerRoot, 'packages', LIB_PACKAGE_NAME);
  const result = await runJest({ consumerRoot, cwd, args: ['config-read-or-default-broker'] });
  report.check(
    'a test importing a gateway wrapper proxy per file has its registerMock hoisted and passes',
    result.code === 0,
    result.code === 0 ? '' : `${result.stdout}\n${result.stderr}`.slice(-2000),
  );
};

// T03 (gateway-pivot): the published @dungeonmaster/testing must really check a staged response
// against a real installed zod contract, not just against source in this repo's own checkout. Both
// cases in the sample file PASS (the mismatched one throws AND the test's own expect(...) catches
// it), so this is a plain passing-jest-run assertion, the same shape as assertGatewayProxyMockTest.
const assertContractCheckTest = async ({ report, consumerRoot }) => {
  const cwd = join(consumerRoot, 'packages', LIB_PACKAGE_NAME);
  const result = await runJest({ consumerRoot, cwd, args: ['contract-check-probe-broker'] });
  report.check(
    "StartEndpointMock.listen's contract param rejects a mismatched staged response in a real install",
    result.code === 0,
    result.code === 0 ? '' : `${result.stdout}\n${result.stderr}`.slice(-2000),
  );
};

// `npm run build --workspaces` runs every workspace's script in package-declaration order, NOT in
// dependency order — this repo's own root build (`scripts/build-workspaces.mjs`) exists BECAUSE
// plain npm has no such ordering, and a consumer that scaffolds a package importing `#gateway/...`
// hits exactly this: `lib`'s build needs `packages/@gateway/node`'s `dist/` to already exist (the
// build tsconfig has no `source` condition, unlike the root typecheck one), so the gateway
// packages must be built first. A real consumer would face the identical ordering problem; this
// harness works around it the same way a well-informed consumer would, by naming the gateway
// packages first.
const assertBuild = async ({ report, consumerRoot }) => {
  const gatewayFirst = await runNpm({
    consumerRoot,
    cwd: consumerRoot,
    args: [
      'run',
      'build',
      '--workspace',
      'packages/@gateway/npm',
      '--workspace',
      'packages/@gateway/node',
      '--workspace',
      'packages/@gateway/browser',
      '--workspace',
      'packages/@gateway/bin',
      '--if-present',
    ],
  });
  // A non-zero exit here does not necessarily mean `dist/` is missing — `tsc` still EMITS on a
  // type error unless `noEmitOnError` is set (confirmed against a real run: `@acme-consumer/node`
  // reports errors and its `dist/` exists anyway), so downstream builds get a real chance rather
  // than being skipped on a report that turned out not to block anything.
  report.check(
    "the consumer's npm run build succeeds (gateway packages)",
    gatewayFirst.code === 0,
    gatewayFirst.code === 0 ? '' : `${gatewayFirst.stdout}\n${gatewayFirst.stderr}`.slice(-2000),
  );

  const result = await runNpm({
    consumerRoot,
    cwd: consumerRoot,
    args: ['run', 'build', '--workspaces', '--if-present'],
  });
  report.check(
    "the consumer's npm run build succeeds",
    result.code === 0,
    result.code === 0 ? '' : `${result.stdout}\n${result.stderr}`.slice(-2000),
  );
};

// `PROBE_PACKAGE_NAME` (sample-sources.mjs) never appears in this list — it holds the one
// deliberate `ban-primitives` violation `assertLint`/`assertPreEditHook` need, so scoping ward onto
// it here would make this check fail by design.
const assertWardCleanFixture = async ({ report, consumerRoot }) => {
  const result = await runWard({
    consumerRoot,
    args: [
      '--only',
      'lint,typecheck,unit,integration',
      '--',
      ...SEEDED_PACKAGE_NAMES.map((packageName) => join('packages', packageName)),
      join('packages', '@gateway', 'browser'),
      join('packages', '@gateway', 'npm'),
      join('packages', '@gateway', 'bin'),
      join('packages', 'hydration-recipes'),
    ],
  });
  report.check(
    'dungeonmaster ward runs in the consumer and exits 0 on the clean fixture (@gateway/node covered separately above, F1)',
    result.code === 0,
    // Each stream's own tail: ward's progress lines go to one stream and its summary to the other,
    // so one tail of the two joined keeps only the progress and drops what actually failed.
    result.code === 0
      ? ''
      : `exit ${String(result.code)}\n--- stdout ---\n${result.stdout.slice(-4000)}\n--- stderr ---\n${result.stderr.slice(-1500)}`,
  );
};

const preEditPayload = ({ consumerRoot, filePath, content }) =>
  JSON.stringify({
    session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    transcript_path: '/tmp/consumer-check-transcript.jsonl',
    cwd: consumerRoot,
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: filePath, content },
  });

const assertPreEditHook = async ({ report, consumerRoot, lintViolationFile }) => {
  const binPath = join(consumerRoot, 'node_modules', '.bin', 'dungeonmaster-pre-edit-lint');
  if (!existsSync(binPath)) {
    report.check('the pre-edit hook binary is installed', false, binPath);
    return;
  }

  // The hook only blocks a violation the edit ADDS — it diffs the file's CURRENT on-disk text
  // against the proposed new text (repo `scrolls/brands-types-tests-rules.md`'s own description of
  // `violations-check-new-broker.ts`). Handing it `lintViolationFile`'s own already-on-disk
  // violating content as the "new" text is a no-op edit from the hook's point of view — old and new
  // are byte-identical, so nothing was ADDED, and it allows the write (confirmed against a real run
  // of this suite: exit 0, not the expected 2). A path that does not exist on disk YET has no "old"
  // text to diff against, so the violating content the payload proposes is entirely new.
  // The path is correctly named for its folder, so the ONLY thing the hook can object to is the
  // `any` — a misnamed file would be blocked for its name and pass this check for the wrong reason.
  const violatingContent = readFileSync(lintViolationFile, 'utf8').replaceAll(
    'preEditProbeBroker',
    'preEditProbeNewBroker',
  );
  const neverWrittenFile = join(
    lintViolationFile,
    '..',
    '..',
    'probe-new',
    'pre-edit-probe-new-broker.ts',
  );
  const blockedResult = await run({
    command: binPath,
    cwd: consumerRoot,
    input: preEditPayload({ consumerRoot, filePath: neverWrittenFile, content: violatingContent }),
    timeoutMs: 30_000,
  });
  report.check(
    'the pre-edit hook blocks a Write that adds a lint violation (exit code 2)',
    blockedResult.code === 2 && /no-explicit-any|Unexpected any/u.test(`${blockedResult.stdout}${blockedResult.stderr}`),
    `exit ${String(blockedResult.code)}: ${blockedResult.stdout}${blockedResult.stderr}`.slice(-1500),
  );

  // Same export name and file identity as the on-disk violator (`preEditProbeBroker`, in
  // `pre-edit-probe-broker.ts`) — only the `any` becomes `string` and the return a branded
  // `PathSegment` — so this is a genuine same-file fix, never a different function under the same
  // name the naming convention (entry file name = folder path + suffix) would itself flag.
  const cleanContent =
    "/**\n * PURPOSE: Uppercases a path segment, returning a branded PathSegment instead of a raw\n * string.\n *\n * USAGE:\n * preEditProbeBroker({ path: 'a/b' });\n */\n\nimport { pathSegmentContract, type PathSegment } from "
    + "'@dungeonmaster/shared/contracts';"
    + "\n\nexport const preEditProbeBroker = ({ path }: { path: string }): PathSegment =>\n  pathSegmentContract.parse(path.toUpperCase());\n";
  const allowedResult = await run({
    command: binPath,
    cwd: consumerRoot,
    input: preEditPayload({ consumerRoot, filePath: lintViolationFile, content: cleanContent }),
    timeoutMs: 30_000,
  });
  report.check(
    'the pre-edit hook allows a clean Write with no violation (exit code 0)',
    allowedResult.code === 0,
    `exit ${String(allowedResult.code)}: ${allowedResult.stdout}${allowedResult.stderr}`.slice(-1500),
  );
};

const snapshotFile = (filePath) => (existsSync(filePath) ? readFileSync(filePath, 'utf8') : null);

const assertIdempotentReinit = async ({ report, consumerRoot }) => {
  const trackedFiles = [
    join(consumerRoot, '.mcp.json'),
    join(consumerRoot, 'tsconfig.json'),
    join(consumerRoot, 'eslint.config.js'),
    join(consumerRoot, '.dungeonmaster.json'),
  ];
  const before = trackedFiles.map(snapshotFile);

  const settingsPath = join(consumerRoot, '.claude', 'settings.json');
  const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
  settings.myOwnCustomKey = 'keep-me';
  writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);

  const secondInit = await runDungeonmasterInit({ consumerRoot });
  report.check('running init a second time succeeds', secondInit.code === 0, secondInit.stderr.slice(-1500));

  const after = trackedFiles.map(snapshotFile);
  const unchanged = before.every((content, index) => content === after[index]);
  report.check(
    'running init a second time changes nothing in the untouched tracked files',
    unchanged,
    unchanged ? '' : 'a tracked file differs after the second init',
  );

  const settingsAfter = JSON.parse(readFileSync(settingsPath, 'utf8'));
  report.check(
    "a second init keeps the user's own hand-added settings.json key",
    settingsAfter.myOwnCustomKey === 'keep-me',
    JSON.stringify(settingsAfter.myOwnCustomKey),
  );
};

// F7 (gateway-pivot): `create-package` never runs `npm install` itself — `cli-create-package-
// responder.ts` prints "Next steps: npm install" and stops there, on purpose, the same way a real
// user's next terminal command would be. So the fixture's own `react`/`@types/react` dependency
// (packages/app/package.json, written by the `frontend-react` seed) sits in package.json but not
// yet in node_modules until this runs — without it, `tsc` reports "Cannot find namespace 'React'"
// on the scaffolded widget (confirmed against a real run of this suite: installing here, and only
// here, makes that error disappear with no other change).
const installScaffoldedPackages = async ({ report, consumerRoot }) => {
  const result = await npmInstall({ cwd: consumerRoot });
  report.check(
    'npm install succeeds after create-package scaffolds lib/app/probe (F7)',
    result.code === 0,
    result.code === 0 ? '' : result.stderr.slice(-2000),
  );
};

export const runWorksAssertions = async ({ report, consumerRoot, gt, mode, scope }) => {
  const { ioTrapTestFile, mswTrapTestFile, lintViolationFile } = await scaffoldFixturePackages({
    consumerRoot,
    cliBin: cliBinPath({ consumerRoot }),
    gt,
    scope,
  });
  await installScaffoldedPackages({ report, consumerRoot });
  // Before every typecheck/lint/build/ward step below: it writes a `lib` broker importing the
  // `#gateway/npm/left-pad` barrel the post-bash hook's gateway-sync generates, so those steps grade it.
  await runAgentInstallAssertions({ report, consumerRoot });

  assertScopeDetection({ report, consumerRoot, gt });
  assertJestConfigBase({ report, consumerRoot });
  assertScaffoldedLayout({ report, consumerRoot });

  // `lintViolationFile` (from sample-sources.mjs) sits inside the DEDICATED `probe` package's own
  // `src/brokers/`, fully covered by ITS tsconfig `include` — a real consumer never has source at
  // repo root (every consumer is an npm-workspaces monorepo — repo CLAUDE.md), so a real package's
  // own broker is where this known violation genuinely belongs. `probe` is never one of the
  // packages `assertWardCleanFixture` scopes `dungeonmaster ward` onto below, so that check exits 0
  // on a genuinely clean `lib`/`app` while lint and the pre-edit hook still see a real violation.
  await assertTypecheck({ report, consumerRoot });
  await assertLint({ report, consumerRoot, lintViolationFile });
  // BEFORE assertGatewayNodeLintPasses's own ward typecheck, and before the gateway-proxy-mock
  // test: both need `@gateway/node` actually BUILT first, exactly like a real consumer would.
  // assertGatewayNodeLintPasses's cross-gateway stub import (browser's fetch-json.proxy.ts reaches
  // `#gateway/node/net/connection-refused-error/connection-refused-error.stub`) resolves through
  // node's package.json `gateway-dist` export condition, which names a file under node's OWN
  // `dist/` — with no dist yet, resolution falls through to node's `source` condition instead,
  // pulling node's SOURCE `.ts` into browser's build program and tripping TS6059 (a file outside
  // browser's own `rootDir`). The gateway-proxy-mock test's `#gateway/node/fs__promises` import
  // resolves through the `require` condition (jest sets no `source` custom condition — only ward's
  // own invocation does, via `check-run-unit-broker`), which points at `./dist/**` too. Both
  // confirmed against a real run of this suite: the TS6059 above, and separately "Cannot find
  // module '#gateway/node/fs__promises'" on a fresh consumer whose gateway packages had never been
  // built yet.
  await assertBuild({ report, consumerRoot });
  await assertGatewayNodeLintPasses({ report, consumerRoot });
  await assertIoTrap({ report, consumerRoot, ioTrapTestFile });
  await assertMswTrap({ report, consumerRoot, mswTrapTestFile });
  await assertGatewayProxyMockTest({ report, consumerRoot });
  await assertContractCheckTest({ report, consumerRoot });
  await assertModuleMockResolves({ report, consumerRoot });
  await assertWardCleanFixture({ report, consumerRoot });
  await assertPreEditHook({ report, consumerRoot, lintViolationFile });
  const handEdited = await handEditGeneratedWrapper({ report, consumerRoot });
  await assertIdempotentReinit({ report, consumerRoot });
  if (handEdited !== null) {
    checkHandEditKept({ report, consumerRoot, edited: handEdited, after: 'a second dungeonmaster init' });
  }

  return { lintViolationFile, ioTrapTestFile };
};
