/**
 * Proves `dungeonmaster gateway-sync` on a real consumer, through the three ways it runs there:
 * `init` (and the root `postinstall` it writes), a bare `npm install` / `npm ci` firing that
 * `postinstall`, and the `dungeonmaster-post-bash` PostToolUse hook after an agent's
 * `npm install <pkg>` — which fires no root `postinstall` on npm 10, so the hook is the only thing
 * that syncs it. Every package named here is tiny and frozen on the registry: `left-pad` (one CJS
 * file, `export =` typings, no dependencies) and `is-odd` (one dependency, `is-number`). It also
 * proves a module mock dungeonmaster's npm gateway ships (`elkjs`) arrives with its copied folder
 * and is what a consumer test importing `#gateway/npm/elkjs` gets under jest.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { runJest, runNpm } from '../bin-run.mjs';
import { REPO_ROOT } from '../ground-truth.mjs';
import { npmInstall } from '../fixture.mjs';
import { consumerEnv, run } from '../proc.mjs';
import { LIB_PACKAGE_NAME } from '../sample-sources.mjs';

// A dependency dungeonmaster's own npm gateway wraps, whose folder imports nothing but `zod` itself
// and its own files — so the sync copies it verbatim rather than generating a passthrough.
const OWN_WRAPPED_PACKAGE = 'zod';
// A dependency whose folder in dungeonmaster's own npm gateway ships a module mock beside the wrapper.
const MOCKED_PACKAGE = 'elkjs';
const MODULE_MOCK_SUFFIX = '.jest-mock.cjs';
const AGENT_INSTALLED_PACKAGE = 'left-pad';
const DEV_ONLY_PACKAGE = 'is-odd';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

const npmGatewayDir = ({ consumerRoot }) => join(consumerRoot, 'packages', '@gateway', 'npm');
const npmGatewaySrc = ({ consumerRoot }) => join(npmGatewayDir({ consumerRoot }), 'src');
const generatedBarrelPath = ({ consumerRoot }) =>
  join(npmGatewaySrc({ consumerRoot }), AGENT_INSTALLED_PACKAGE, `${AGENT_INSTALLED_PACKAGE}.ts`);

const npmGatewayDependencies = ({ consumerRoot }) =>
  readJson(join(npmGatewayDir({ consumerRoot }), 'package.json')).dependencies ?? {};

// The consumer declares the SAME ranges this checkout's own npm gateway declares, read off disk, so
// the root dependencies and the copied wrappers never disagree about which version they target.
export const ownWrappedRootDependencies = () => {
  const ownDependencies = readJson(join(REPO_ROOT, 'packages', '@gateway', 'npm', 'package.json')).dependencies;
  return {
    [OWN_WRAPPED_PACKAGE]: ownDependencies[OWN_WRAPPED_PACKAGE],
    [MOCKED_PACKAGE]: ownDependencies[MOCKED_PACKAGE],
  };
};

const listFilesRecursive = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? listFilesRecursive(join(dir, entry.name)) : [join(dir, entry.name)],
  );

// Both modes: `init` writes the postinstall into a root package.json that had none. The expected
// value is whatever the real generator produces for an empty package.json, never a retyped string.
export const checkRootPostinstall = ({ report, consumerRoot, gt }) => {
  const expected = gt.rootPostinstallMergeTransformer({ rootPackageJson: {} }).scripts?.postinstall;
  const actual = readJson(join(consumerRoot, 'package.json')).scripts?.postinstall;
  report.check(
    'root package.json scripts.postinstall runs dungeonmaster gateway-sync (matches the real generator)',
    typeof expected === 'string' && actual === expected,
    typeof expected === 'string' && actual === expected ? '' : `got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
  );
};

// Local mode only: global mode's consumer declares no dependency and has no local
// `node_modules/@dungeonmaster/npm` to compare against.
export const checkOwnWrapperCopied = ({ report, consumerRoot, gt }) => {
  const ownDir = join(consumerRoot, 'node_modules', '@dungeonmaster', 'npm', 'src', OWN_WRAPPED_PACKAGE);
  const consumerDir = join(npmGatewaySrc({ consumerRoot }), OWN_WRAPPED_PACKAGE);
  if (!existsSync(ownDir) || !existsSync(consumerDir)) {
    report.check(
      `init's gateway-sync copied dungeonmaster's own ${OWN_WRAPPED_PACKAGE} wrapper into packages/@gateway/npm/src (local mode only)`,
      false,
      `${ownDir} exists: ${String(existsSync(ownDir))}; ${consumerDir} exists: ${String(existsSync(consumerDir))}`,
    );
    return;
  }
  const ownFiles = listFilesRecursive(ownDir).map((path) => relative(ownDir, path)).sort();
  const consumerFiles = listFilesRecursive(consumerDir).map((path) => relative(consumerDir, path)).sort();
  const differing = [...new Set([...ownFiles, ...consumerFiles])].filter(
    (file) =>
      !ownFiles.includes(file) ||
      !consumerFiles.includes(file) ||
      !readFileSync(join(ownDir, file)).equals(readFileSync(join(consumerDir, file))),
  );
  report.check(
    `init's gateway-sync copied packages/@gateway/npm/src/${OWN_WRAPPED_PACKAGE} byte-identical to node_modules/@dungeonmaster/npm/src/${OWN_WRAPPED_PACKAGE} (local mode only)`,
    differing.length === 0 && ownFiles.length > 0,
    differing.length === 0 ? '' : `differs or missing on one side: ${differing.join(', ')}`,
  );

  const declared = ownWrappedRootDependencies()[OWN_WRAPPED_PACKAGE];
  const recorded = npmGatewayDependencies({ consumerRoot })[OWN_WRAPPED_PACKAGE];
  report.check(
    `packages/@gateway/npm/package.json dependencies lists ${OWN_WRAPPED_PACKAGE} at the root's declared range (local mode only)`,
    recorded === declared,
    recorded === declared ? '' : `got ${JSON.stringify(recorded)}, expected ${JSON.stringify(declared)}`,
  );

  const placeholder = join(npmGatewayDir({ consumerRoot }), gt.gatewayPackageTemplateStatics.placeholderPath);
  report.check(
    'packages/@gateway/npm drops its placeholder index.d.ts once a subpath exists (local mode only)',
    !existsSync(placeholder),
    existsSync(placeholder) ? placeholder : '',
  );
};

// Local mode only: the module mock ships in the published npm gateway's `src`, and the sync's
// recursive folder copy is what carries it into the consumer.
export const checkModuleMockCopied = ({ report, consumerRoot }) => {
  const mockFile = `${MOCKED_PACKAGE}${MODULE_MOCK_SUFFIX}`;
  const ownMock = join(consumerRoot, 'node_modules', '@dungeonmaster', 'npm', 'src', MOCKED_PACKAGE, mockFile);
  const consumerMock = join(npmGatewaySrc({ consumerRoot }), MOCKED_PACKAGE, mockFile);
  const bothExist = existsSync(ownMock) && existsSync(consumerMock);
  report.check(
    `init's gateway-sync copied packages/@gateway/npm/src/${MOCKED_PACKAGE}/${mockFile} byte-identical to the published one (local mode only)`,
    bothExist && readFileSync(ownMock).equals(readFileSync(consumerMock)),
    bothExist ? '' : `${ownMock} exists: ${String(existsSync(ownMock))}; ${consumerMock} exists: ${String(existsSync(consumerMock))}`,
  );
};

const postBashPayload = ({ consumerRoot, command }) =>
  JSON.stringify({
    session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    transcript_path: '/tmp/consumer-check-transcript.jsonl',
    cwd: consumerRoot,
    hook_event_name: 'PostToolUse',
    tool_name: 'Bash',
    tool_input: { command },
  });

// What an agent's Bash tool call does: run the install, then Claude Code feeds the post-bash hook
// the same command. The hook's own `dungeonmaster` child resolves through PATH, so it gets the
// consumer's env, the way a Claude Code session started in the consumer would.
const agentNpmInstall = async ({ report, consumerRoot, args, label }) => {
  const install = await runNpm({ consumerRoot, cwd: consumerRoot, args });
  report.check(
    `npm ${args.join(' ')} succeeds in the consumer`,
    install.code === 0,
    install.code === 0 ? '' : `${install.stdout}\n${install.stderr}`.slice(-2000),
  );
  if (install.code !== 0) {
    return null;
  }

  const hookBin = join(consumerRoot, 'node_modules', '.bin', 'dungeonmaster-post-bash');
  if (!existsSync(hookBin)) {
    report.check('the post-bash hook binary is installed', false, hookBin);
    return null;
  }
  const hook = await run({
    command: hookBin,
    cwd: consumerRoot,
    env: consumerEnv({ consumerRoot }),
    input: postBashPayload({ consumerRoot, command: `npm ${args.join(' ')}` }),
    timeoutMs: 5 * 60 * 1000,
  });
  let additionalContext = null;
  try {
    const output = JSON.parse(hook.stdout);
    additionalContext =
      output.hookSpecificOutput?.hookEventName === 'PostToolUse'
        ? output.hookSpecificOutput.additionalContext
        : null;
  } catch {
    additionalContext = null;
  }
  report.check(
    `the post-bash hook runs gateway-sync after ${label} and prints PostToolUse JSON (exit 0)`,
    hook.code === 0 && typeof additionalContext === 'string',
    `exit ${String(hook.code)}: ${hook.stdout}${hook.stderr}`.slice(-1500),
  );
  return additionalContext;
};

const LEFT_PAD_PROOF_SOURCE = `/**
 * PURPOSE: Zero-pads a label to a fixed width through the npm gateway's left-pad passthrough. Exists
 * only to prove a \`#gateway/npm/<folder>\` barrel the post-bash hook's gateway-sync generated resolves,
 * lints and typechecks in a consumer package.
 *
 * USAGE:
 * labelPadBroker({ label: '7', width: 3 });
 * // Returns '007'
 */

import leftPad from '#gateway/npm/left-pad';

export const labelPadBroker = ({ label, width }: { label: string; width: number }): string =>
  leftPad(label, width, '0');
`;

const LEFT_PAD_PROOF_PROXY = `export const labelPadBrokerProxy = (): Record<PropertyKey, never> => ({});
`;

const LEFT_PAD_PROOF_TEST = `import { labelPadBroker } from './label-pad-broker';
import { labelPadBrokerProxy } from './label-pad-broker.proxy';

describe('labelPadBroker', () => {
  it('VALID: {label: "7", width: 3} => returns the zero-padded label', () => {
    labelPadBrokerProxy();

    expect(labelPadBroker({ label: '7', width: 3 })).toBe('007');
  });
});
`;

// Written into `lib` (which already depends on the npm gateway package), so the suite's existing
// typecheck, lint, build and ward steps grade the import with no extra run of their own.
const writeLeftPadImporter = ({ consumerRoot }) => {
  const dir = join(consumerRoot, 'packages', LIB_PACKAGE_NAME, 'src', 'brokers', 'label', 'pad');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'label-pad-broker.ts'), LEFT_PAD_PROOF_SOURCE);
  writeFileSync(join(dir, 'label-pad-broker.proxy.ts'), LEFT_PAD_PROOF_PROXY);
  writeFileSync(join(dir, 'label-pad-broker.test.ts'), LEFT_PAD_PROOF_TEST);
};

const MODULE_MOCK_PROOF_SOURCE = `/**
 * PURPOSE: Builds an ELK layout engine through the npm gateway's elkjs wrapper. Exists only to prove
 * a consumer test importing \`#gateway/npm/elkjs\` gets the gateway's own module mock under jest.
 *
 * USAGE:
 * layoutEngineBroker();
 * // Returns a new ELK instance
 */

import ELK from '#gateway/npm/elkjs';

export const layoutEngineBroker = (): InstanceType<typeof ELK> => new ELK();
`;

const MODULE_MOCK_PROOF_PROXY = `export const layoutEngineBrokerProxy = (): Record<PropertyKey, never> => ({});
`;

// The real ELK is a class, not a mock: `toHaveBeenCalledTimes` on it throws, so this passes only
// when jest handed the test the gateway's `elkjs.jest-mock.cjs`.
const MODULE_MOCK_PROOF_TEST = `import ELK from '#gateway/npm/elkjs';
import { layoutEngineBroker } from './layout-engine-broker';
import { layoutEngineBrokerProxy } from './layout-engine-broker.proxy';

describe('layoutEngineBroker', () => {
  it('VALID: {} => builds the engine from the gateway elkjs module mock', () => {
    layoutEngineBrokerProxy();

    layoutEngineBroker();

    expect(ELK).toHaveBeenCalledTimes(1);
    expect(ELK).toHaveBeenCalledWith();
  });
});
`;

const writeModuleMockProof = ({ consumerRoot }) => {
  const dir = join(consumerRoot, 'packages', LIB_PACKAGE_NAME, 'src', 'brokers', 'layout', 'engine');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'layout-engine-broker.ts'), MODULE_MOCK_PROOF_SOURCE);
  writeFileSync(join(dir, 'layout-engine-broker.proxy.ts'), MODULE_MOCK_PROOF_PROXY);
  writeFileSync(join(dir, 'layout-engine-broker.test.ts'), MODULE_MOCK_PROOF_TEST);
};

// Local mode only, after the proof `runAgentInstallAssertions` wrote into `lib`: jest resolves
// `#gateway/npm/elkjs` through the published testing base's `resolver`, from inside node_modules.
export const assertModuleMockResolves = async ({ report, consumerRoot }) => {
  const cwd = join(consumerRoot, 'packages', LIB_PACKAGE_NAME);
  const result = await runJest({ consumerRoot, cwd, args: ['layout-engine-broker'] });
  report.check(
    `a lib test importing #gateway/npm/${MOCKED_PACKAGE} gets packages/@gateway/npm/src/${MOCKED_PACKAGE}/${MOCKED_PACKAGE}${MODULE_MOCK_SUFFIX} under jest`,
    result.code === 0,
    result.code === 0 ? '' : `${result.stdout}\n${result.stderr}`.slice(-2000),
  );
};

// Runs after `create-package` and its `npm install`, and BEFORE the typecheck/lint/build/ward steps,
// so the left-pad importer this writes is graded by those steps like any other lib source.
export const runAgentInstallAssertions = async ({ report, consumerRoot }) => {
  const leftPadContext = await agentNpmInstall({
    report,
    consumerRoot,
    args: ['install', AGENT_INSTALLED_PACKAGE, '-w', join('packages', LIB_PACKAGE_NAME), '--no-audit', '--no-fund'],
    label: `npm install ${AGENT_INSTALLED_PACKAGE}`,
  });
  if (leftPadContext !== null) {
    report.check(
      `the post-bash hook's additionalContext names ${AGENT_INSTALLED_PACKAGE}`,
      leftPadContext.includes(AGENT_INSTALLED_PACKAGE),
      leftPadContext.slice(-1500),
    );
  }

  const barrelPath = generatedBarrelPath({ consumerRoot });
  const barrel = existsSync(barrelPath) ? readFileSync(barrelPath, 'utf8') : '';
  report.check(
    `the hook's gateway-sync generated packages/@gateway/npm/src/${AGENT_INSTALLED_PACKAGE}/${AGENT_INSTALLED_PACKAGE}.ts as a passthrough of ${AGENT_INSTALLED_PACKAGE}`,
    (barrel.includes(`require('${AGENT_INSTALLED_PACKAGE}')`) ||
      barrel.includes(`from '${AGENT_INSTALLED_PACKAGE}'`)) &&
      existsSync(join(npmGatewaySrc({ consumerRoot }), AGENT_INSTALLED_PACKAGE, `${AGENT_INSTALLED_PACKAGE}.test.ts`)),
    barrel === '' ? `not found at ${barrelPath}` : barrel.slice(-600),
  );
  const recorded = npmGatewayDependencies({ consumerRoot })[AGENT_INSTALLED_PACKAGE];
  report.check(
    `packages/@gateway/npm/package.json dependencies lists ${AGENT_INSTALLED_PACKAGE} after the hook's gateway-sync`,
    typeof recorded === 'string',
    typeof recorded === 'string' ? '' : JSON.stringify(recorded),
  );

  await agentNpmInstall({
    report,
    consumerRoot,
    args: ['install', '-D', DEV_ONLY_PACKAGE, '-w', join('packages', LIB_PACKAGE_NAME), '--no-audit', '--no-fund'],
    label: `npm install -D ${DEV_ONLY_PACKAGE}`,
  });
  report.check(
    `a devDependency-only package (${DEV_ONLY_PACKAGE}) gets no packages/@gateway/npm/src folder and no gateway dependency`,
    !existsSync(join(npmGatewaySrc({ consumerRoot }), DEV_ONLY_PACKAGE)) &&
      npmGatewayDependencies({ consumerRoot })[DEV_ONLY_PACKAGE] === undefined,
    existsSync(join(npmGatewaySrc({ consumerRoot }), DEV_ONLY_PACKAGE))
      ? readdirSync(npmGatewaySrc({ consumerRoot })).join(', ')
      : '',
  );

  // `npm ci` refuses a lockfile out of step with any workspace package.json, so this passing is the
  // proof the hook's gateway-sync brought the lockfile back in step after it recorded left-pad. Its
  // `postinstall` runs gateway-sync under npm_command=ci, which must write nothing and exit 0.
  const ci = await run({
    command: 'npm',
    args: ['ci', '--no-audit', '--no-fund'],
    cwd: consumerRoot,
    env: consumerEnv({ consumerRoot }),
    timeoutMs: 10 * 60 * 1000,
  });
  report.check(
    'npm ci succeeds after the agent installs (lockfile in step with packages/@gateway/npm/package.json)',
    ci.code === 0,
    ci.code === 0 ? '' : `${ci.stdout}\n${ci.stderr}`.slice(-2000),
  );

  writeLeftPadImporter({ consumerRoot });
  writeModuleMockProof({ consumerRoot });
};

const HAND_EDIT = '// consumer-check: a hand edit gateway-sync must never overwrite\n';

// Runs AFTER the lint/typecheck/ward steps, so the appended comment is never graded.
export const handEditGeneratedWrapper = async ({ report, consumerRoot }) => {
  const barrelPath = generatedBarrelPath({ consumerRoot });
  if (!existsSync(barrelPath)) {
    report.check(`the generated ${AGENT_INSTALLED_PACKAGE} barrel exists to hand-edit`, false, barrelPath);
    return null;
  }
  const edited = `${readFileSync(barrelPath, 'utf8')}${HAND_EDIT}`;
  writeFileSync(barrelPath, edited);

  const install = await npmInstall({ cwd: consumerRoot, env: consumerEnv({ consumerRoot }) });
  report.check(
    'a bare npm install (firing the root postinstall gateway-sync) succeeds after a hand edit to a generated wrapper',
    install.code === 0,
    install.code === 0 ? '' : `${install.stdout}\n${install.stderr}`.slice(-2000),
  );
  checkHandEditKept({ report, consumerRoot, edited, after: 'a bare npm install' });
  return edited;
};

export const checkHandEditKept = ({ report, consumerRoot, edited, after }) => {
  const barrelPath = generatedBarrelPath({ consumerRoot });
  const current = existsSync(barrelPath) ? readFileSync(barrelPath, 'utf8') : null;
  report.check(
    `a hand-edited packages/@gateway/npm/src/${AGENT_INSTALLED_PACKAGE}/${AGENT_INSTALLED_PACKAGE}.ts is byte-identical after ${after}`,
    current === edited,
    current === edited ? '' : current === null ? `missing: ${barrelPath}` : current.slice(-600),
  );
};
