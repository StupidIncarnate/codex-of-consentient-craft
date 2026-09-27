/**
 * Proves the freshly-init-ed consumer actually WORKS — typecheck, lint (plus the known F1 lint
 * failure on the copied `@gateway/node`, asserted rather than swallowed), `create-package`'s own
 * scope detection and scaffolded jest config (F5, F6 — plain passing assertions now that both are
 * fixed; no patching), the copied gateways' own tests, the I/O trap, a mocked gateway-proxy test,
 * the consumer's own build, the pre-edit hook, and idempotent re-init — every check here shells out
 * to the consumer's OWN installed binaries (`node_modules/.bin/*`), never this checkout's compiled
 * output.
 */

import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runDungeonmasterInit, runEslint, runJest, runNpm, runTsc, runWard } from '../bin-run.mjs';
import { run } from '../proc.mjs';
import { classifyGatewayNodeLintResult } from '../lint-known-failures.mjs';
import { LIB_PACKAGE_NAME, WEB_PACKAGE_NAME, scaffoldFixturePackages } from '../sample-sources.mjs';

const cliBinPath = ({ consumerRoot }) => join(consumerRoot, 'node_modules', '.bin', 'dungeonmaster');

// F5 (gateway-pivot): the real, on-disk scope every scaffolded package's `#gateway/*` imports field
// must agree with — read straight off `packages/@gateway/node/package.json`'s own `name` (never
// assumed), the same package `dungeonmaster init`'s gateway step scaffolded and named with
// `gatewayScopeDetectTransformer`. `create-package`'s own scope detection now reuses that SAME
// transformer, so the two are guaranteed to agree by construction; this only proves it holds for a
// real run.
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

  for (const packageName of [LIB_PACKAGE_NAME, WEB_PACKAGE_NAME]) {
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
  for (const packageName of [LIB_PACKAGE_NAME, WEB_PACKAGE_NAME]) {
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

const assertTypecheck = async ({ report, consumerRoot }) => {
  for (const packageName of [LIB_PACKAGE_NAME, WEB_PACKAGE_NAME]) {
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

const assertLint = async ({ report, consumerRoot, inPackageViolationFile }) => {
  for (const packageName of [LIB_PACKAGE_NAME, WEB_PACKAGE_NAME]) {
    const packageDir = join(consumerRoot, 'packages', packageName);
    const result = await runEslintForPackage({ consumerRoot, packageDir });
    const eslintJson = parseEslintJson({ report, result, label: `consumer lint (packages/${packageName})` });
    if (eslintJson === null) {
      continue;
    }

    const filesWithErrors = eslintJson.filter(
      (entry) => entry.errorCount > 0 && entry.filePath !== inPackageViolationFile,
    );
    report.check(
      `lint passes on every file in the clean fixture (packages/${packageName})`,
      filesWithErrors.length === 0,
      filesWithErrors.length === 0
        ? ''
        : JSON.stringify(filesWithErrors.map((entry) => ({ filePath: entry.filePath, messages: entry.messages }))),
    );

    if (packageName === LIB_PACKAGE_NAME) {
      const violatorResult = eslintJson.find((entry) => entry.filePath === inPackageViolationFile);
      report.check(
        'lint flags the sample file with a known violation (ban-primitives: a raw string return)',
        Boolean(violatorResult && violatorResult.errorCount > 0),
        violatorResult ? `errorCount ${violatorResult.errorCount}` : 'file not present in eslint results',
      );
    }
  }
};

const assertGatewayNodeKnownF1 = async ({ report, consumerRoot }) => {
  const packageRoot = join(consumerRoot, 'packages', '@gateway', 'node');
  const result = await runEslintForPackage({ consumerRoot, packageDir: packageRoot });
  const eslintJson = parseEslintJson({ report, result, label: 'unit F1' });
  if (eslintJson === null) {
    return;
  }
  const classification = classifyGatewayNodeLintResult({ eslintJson, packageRoot });
  if (classification.failingFileCount === 0) {
    report.check(
      'unit F1 (EPIC.md): consumer lint of @gateway/node — NO LONGER REPRODUCES (regression may be fixed; update EPIC.md)',
      true,
      'eslint reported zero errors on packages/@gateway/node in this consumer',
    );
  } else {
    report.check(
      'unit F1 (EPIC.md): consumer lint of @gateway/node fails in EXACTLY the documented shape (no-unused-vars on 5 proxies, no-deprecated on fetch-ok.ts) and nothing else',
      classification.matchesKnownF1Only,
      classification.matchesKnownF1Only
        ? `known-failing as documented: ${classification.failingFileCount} files`
        : `unexpectedFiles=${JSON.stringify(classification.unexpectedFiles)} unexpectedRules=${JSON.stringify(classification.unexpectedRules)}`,
    );
  }

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
    'the copied gateways’ own typecheck/unit/integration checks pass in the consumer (lint excluded — F1)',
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
  const cwd = join(consumerRoot, 'packages', LIB_PACKAGE_NAME);
  const result = await runJest({ consumerRoot, cwd, args: [ioTrapTestFile] });
  const output = `${result.stdout}\n${result.stderr}`;
  report.check(
    'a sample unit test making an unstaged fs call fails via the [io-trap] afterEach',
    result.code !== 0 && output.includes('[io-trap] unstaged fs.readFileSync'),
    output.slice(-2000),
  );
};

// T01 (gateway-pivot 02176f3c5): unlike the I/O trap (which throws synchronously at the call
// site, so the test itself can assert the throw and PASS), MSW's unhandled-request check runs in
// `start-endpoint-mock-setup.ts`'s own `afterEach`, so the failure lands on the test as a whole —
// this is an EXPECTED-FAILING jest run, not a passing assertion of a throw.
const assertMswTrap = async ({ report, consumerRoot, mswTrapTestFile }) => {
  const cwd = join(consumerRoot, 'packages', LIB_PACKAGE_NAME);
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
  const result = await runJest({ consumerRoot, cwd, args: ['read-config-or-default'] });
  report.check(
    'a test importing a gateway wrapper proxy per file has its registerMock hoisted and passes',
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

const assertWardCleanFixture = async ({ report, consumerRoot }) => {
  const result = await runWard({
    consumerRoot,
    args: [
      '--only',
      'lint,typecheck,unit,integration',
      '--',
      join('packages', LIB_PACKAGE_NAME),
      join('packages', WEB_PACKAGE_NAME),
      join('packages', '@gateway', 'browser'),
      join('packages', '@gateway', 'npm'),
      join('packages', '@gateway', 'bin'),
      join('packages', 'hydration-recipes'),
    ],
  });
  report.check(
    'dungeonmaster ward runs in the consumer and exits 0 on the clean fixture (F1 excluded — its own dedicated check above)',
    result.code === 0,
    result.code === 0 ? '' : `${result.stdout}\n${result.stderr}`.slice(-3000),
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

const assertPreEditHook = async ({ report, consumerRoot, inPackageViolationFile }) => {
  const binPath = join(consumerRoot, 'node_modules', '.bin', 'dungeonmaster-pre-edit-lint');
  if (!existsSync(binPath)) {
    report.check('the pre-edit hook binary is installed', false, binPath);
    return;
  }

  // The hook only blocks a violation the edit ADDS — it diffs the file's CURRENT on-disk text
  // against the proposed new text (repo `scrolls/brands-types-tests-rules.md`'s own description of
  // `violations-check-new-broker.ts`). Handing it `inPackageViolationFile`'s own already-on-disk
  // violating content as the "new" text is a no-op edit from the hook's point of view — old and new
  // are byte-identical, so nothing was ADDED, and it allows the write (confirmed against a real run
  // of this suite: exit 0, not the expected 2). A path that does not exist on disk YET has no "old"
  // text to diff against, so the violating content the payload proposes is entirely new.
  const violatingContent = readFileSync(inPackageViolationFile, 'utf8');
  const neverWrittenFile = join(
    join(inPackageViolationFile, '..'),
    'pre-edit-hook-new-file-probe-broker.ts',
  );
  const blockedResult = await run({
    command: binPath,
    cwd: consumerRoot,
    input: preEditPayload({ consumerRoot, filePath: neverWrittenFile, content: violatingContent }),
    timeoutMs: 30_000,
  });
  report.check(
    'the pre-edit hook blocks a Write that adds a lint violation (exit code 2)',
    blockedResult.code === 2,
    `exit ${String(blockedResult.code)}: ${blockedResult.stdout}${blockedResult.stderr}`.slice(-1500),
  );

  const cleanContent =
    '/**\n * PURPOSE: A clean, pre-edit-hook-compliant file used only to prove the hook ALLOWS a well-formed write.\n *\n * USAGE:\n * preEditCleanBroker();\n */\n\nimport { pathSegmentContract, type PathSegment } from '
    + "'@dungeonmaster/shared/contracts';"
    + '\n\nexport const preEditCleanBroker = ({ value }: { value: string }): PathSegment =>\n  pathSegmentContract.parse(value);\n';
  const allowedResult = await run({
    command: binPath,
    cwd: consumerRoot,
    input: preEditPayload({ consumerRoot, filePath: inPackageViolationFile, content: cleanContent }),
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

export const runWorksAssertions = async ({ report, consumerRoot, gt, mode }) => {
  const { ioTrapTestFile, mswTrapTestFile, lintViolationFile } = await scaffoldFixturePackages({
    consumerRoot,
    cliBin: cliBinPath({ consumerRoot }),
    gt,
  });

  assertScopeDetection({ report, consumerRoot, gt });
  assertJestConfigBase({ report, consumerRoot });

  // `lintViolationFile` (from sample-sources.mjs) sits at the consumer ROOT — outside every
  // package's own tsconfig `include`, so typescript-eslint's `parserOptions.project` can never
  // parse it (the scaffolded root tsconfig.json's own `"files": []` accepts nothing directly; it
  // exists only for packages to `extends`). A real consumer never has source at repo root (every
  // consumer is an npm-workspaces monorepo — repo CLAUDE.md), so this copies the same known
  // violation INSIDE `packages/lib/src` instead, where a real package's own lint genuinely applies.
  const inPackageViolationFile = join(
    consumerRoot,
    'packages',
    LIB_PACKAGE_NAME,
    'src',
    'lint-violation-sample.ts',
  );
  copyFileSync(lintViolationFile, inPackageViolationFile);

  await assertTypecheck({ report, consumerRoot });
  await assertLint({ report, consumerRoot, inPackageViolationFile });
  await assertGatewayNodeKnownF1({ report, consumerRoot });
  // BEFORE the gateway-proxy-mock test, never after: that test's own `#gateway/node/fs__promises`
  // import resolves through the `require` condition (jest sets no `source` custom condition — only
  // ward's own invocation does, via `check-run-unit-broker`), which points at `./dist/**` — so it
  // needs `@gateway/node` actually BUILT first, exactly like a real consumer would (confirmed
  // against a real run of this suite: "Cannot find module '#gateway/node/fs__promises'" on a fresh
  // consumer whose gateway packages had never been built yet).
  await assertBuild({ report, consumerRoot });
  await assertIoTrap({ report, consumerRoot, ioTrapTestFile });
  await assertMswTrap({ report, consumerRoot, mswTrapTestFile });
  await assertGatewayProxyMockTest({ report, consumerRoot });
  await assertWardCleanFixture({ report, consumerRoot });
  await assertPreEditHook({ report, consumerRoot, inPackageViolationFile });
  await assertIdempotentReinit({ report, consumerRoot });

  return { lintViolationFile, ioTrapTestFile };
};
