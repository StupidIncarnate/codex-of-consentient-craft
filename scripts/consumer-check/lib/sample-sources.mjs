/**
 * Scaffolds the consumer's own application fixture packages using the INSTALLED `dungeonmaster
 * create-package` — never a hand-written package.json/tsconfig/jest.config (packages/CLAUDE.md's
 * own "do not hand-copy configs off a sibling"): `lib` (packageType `library`) proves the NODE
 * gateway platform end to end — a broker importing a gateway proxy from its own file, proving
 * `registerMock` hoists, and (in `probe`) a broker making a raw unstaged `fs` call through the node
 * gateway's passthrough, proving the I/O trap fires —
 * `app` (packageType `frontend-react`) proves the BROWSER gateway platform and `init`'s own
 * e2e-eligibility detection sees a real frontend-react package in this fixture, and `probe`
 * (packageType `library`) holds ONLY the deliberate `ban-primitives` violation `assertLint` and
 * `assertPreEditHook` need. `assertWardCleanFixture` never scopes `dungeonmaster ward` onto `probe`,
 * so that check exits 0 over a genuinely clean `lib`/`app` while the violation still sits inside a
 * real package's own tsconfig `include`, where lint and the pre-edit hook genuinely apply to it.
 *
 * Every sample below follows THIS repo's own architecture exactly (get-architecture,
 * get-testing-patterns, get-folder-detail: brokers) — the 2-level
 * `<folderType>/<domain-or-package>/<action>/` depth `create-package`'s own seed uses, a
 * PURPOSE/USAGE header on every implementation file, and a colocated `.proxy.ts` + `.test.ts`
 * beside each one — the same rules a real consumer's own lint enforces on its own code, so the
 * fixture never trips a violation THIS suite does not intend. Every outside package, Node module
 * and platform global a sample touches goes through `#gateway/...` (`raw-import-ban` and
 * `platform-globals-ban` apply to a consumer exactly as they do here), and a npm package the
 * consumer's npm gateway has no wrapper for gets one written into that gateway first, the way the
 * `consumerGatewayWrapper` session snippet tells a consumer to.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { run } from './proc.mjs';

export const LIB_PACKAGE_NAME = 'lib';
export const WEB_PACKAGE_NAME = 'app';
export const PROBE_PACKAGE_NAME = 'probe';
export const INK_PACKAGE_NAME = 'tui';
export const API_PACKAGE_NAME = 'api';
export const MCP_PACKAGE_NAME = 'tools';
export const SERVICE_PACKAGE_NAME = 'jobs';
export const PLUGIN_PACKAGE_NAME = 'rules';
export const HOOKS_PACKAGE_NAME = 'hooks';
export const CLI_PACKAGE_NAME = 'runner';

// Every scaffolded package the clean-fixture checks cover: the two seeds whose sources this file
// writes into (lib, app) and the seeds that ship no hand-written source (tui: frontend-ink,
// api: http-backend, tools: mcp-server, jobs: programmatic-service, rules: eslint-plugin,
// hooks: hook-handlers, runner: cli-tool), which prove create-package's own output lints,
// typechecks and tests green.
export const SEEDED_PACKAGE_NAMES = [
  LIB_PACKAGE_NAME,
  WEB_PACKAGE_NAME,
  INK_PACKAGE_NAME,
  API_PACKAGE_NAME,
  MCP_PACKAGE_NAME,
  SERVICE_PACKAGE_NAME,
  PLUGIN_PACKAGE_NAME,
  HOOKS_PACKAGE_NAME,
  CLI_PACKAGE_NAME,
];

// The seeds whose package type has no folder-type barrel: their `exports` holds no `./<folderType>`
// key at all, so the layout check must not demand one.
export const NO_BARREL_PACKAGE_NAMES = [PLUGIN_PACKAGE_NAME, HOOKS_PACKAGE_NAME, CLI_PACKAGE_NAME];

// The seeds whose package type has an entry, so `exports` carries a `.` key (and no other seed's does).
export const DOT_ENTRY_PACKAGE_NAMES = [PLUGIN_PACKAGE_NAME, CLI_PACKAGE_NAME];

const CREATE_PACKAGE_TIMEOUT_MS = 120_000;

const runCreatePackage = async ({ consumerRoot, cliBin, name, type }) => {
  const result = await run({
    command: 'node',
    args: [cliBin, 'create-package', '--name', name, '--type', type],
    cwd: consumerRoot,
    timeoutMs: CREATE_PACKAGE_TIMEOUT_MS,
  });
  if (result.code !== 0) {
    throw new Error(
      `create-package --name ${name} --type ${type} failed:\n${result.stdout}\n${result.stderr}`,
    );
  }
};

// The REAL (non-proxy) import goes through the fs__promises GROUP BARREL, never the deep per-file
// path: the gateway's bare `"./*"` export key resolves ONE captured segment to that folder's barrel
// file (`src/fs__promises/fs__promises.ts`), so `#gateway/node/fs__promises` is the whole legal
// specifier — `.../read-file-if-exists/read-file-if-exists` is TS2307 (confirmed against a real run
// of this suite). Only `.proxy`/`.stub` specifically use the deep per-file form, via the gateway's
// OTHER two export keys (concession 1). The return is a plain `string`: a standalone
// scalar brand no longer exists (EPIC concession 25), and no rule the consumer runs brands a scalar return.
const HOISTING_PROOF_SOURCE = `/**
 * PURPOSE: Reads a config file through the node gateway and falls back to a default value when the
 * file is missing. Proves a broker resolves the gateway's fs__promises BARREL import
 * (\`#gateway/node/fs__promises\`), the group-barrel form every wrapped call outside \`.proxy\`/\`.stub\`
 * uses, rather than a wrapper's own deep per-file path.
 *
 * USAGE:
 * await configReadOrDefaultBroker({ configPath: '/repo/.dungeonmaster.json', fallback: '{}' });
 * // Returns the file's contents, or the fallback
 */

import { readFileIfExists } from '#gateway/node/fs__promises';
export const configReadOrDefaultBroker = async ({
  configPath,
  fallback,
}: {
  configPath: string;
  fallback: string;
}): Promise<string> => {
  const contents = await readFileIfExists(configPath);
  return contents === null ? fallback : contents;
};
`;

// Composes the gateway's own per-file proxy (concession 1 / brands doc C6 — no `_test_` barrel) in
// the broker's OWN proxy, per the Proxy Encapsulation Rule: a test never chains through a
// grandchild proxy directly, it calls one semantic method on the proxy of the thing it is testing.
// `enforce-proxy-child-creation` requires exactly this: the implementation above imports a real
// WRAPPED gateway export (not a pass-through), so this proxy must import and construct
// `readFileIfExistsProxy` or lint reports `missingProxyImport`/`missingProxyCreation`.
const HOISTING_PROOF_PROXY = `import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';

export const configReadOrDefaultBrokerProxy = (): {
  returns: (params: { configPath: string; contents: string }) => void;
  missing: (params: { configPath: string }) => void;
} => {
  const gatewayProxy = readFileIfExistsProxy();

  return {
    returns: ({ configPath, contents }: { configPath: string; contents: string }): void =>
      gatewayProxy.returns({ path: configPath, contents }),
    missing: ({ configPath }: { configPath: string }): void =>
      gatewayProxy.missing({ path: configPath }),
  };
};
`;

// Imports the broker's OWN proxy (not the gateway proxy directly) SECOND, after the broker itself —
// the gateway proxy's `registerMock` call only sits one file further down this same import chain, so
// the hoisting proof is identical: if `registerMock`'s AST transformer did not hoist it ahead of
// every import, `fs/promises.readFile` would already be bound to the real implementation by the time
// `.returns(...)` runs (confirmed against a real run of this suite).
const HOISTING_PROOF_TEST = `import { configReadOrDefaultBroker } from './config-read-or-default-broker';
import { configReadOrDefaultBrokerProxy } from './config-read-or-default-broker.proxy';

describe('configReadOrDefaultBroker', () => {
  it('VALID: {configPath: staged file} => returns the mocked contents, proving the proxy mock hoisted', async () => {
    const proxy = configReadOrDefaultBrokerProxy();
    proxy.returns({ configPath: '/consumer-check/config.json', contents: 'from-hoisted-mock' });

    const result = await configReadOrDefaultBroker({
      configPath: '/consumer-check/config.json',
      fallback: 'unused-fallback',
    });

    expect(result).toBe('from-hoisted-mock');
  });

  it('EMPTY: {configPath: missing file} => returns the fallback', async () => {
    const proxy = configReadOrDefaultBrokerProxy();
    proxy.missing({ configPath: '/consumer-check/missing.json' });

    const result = await configReadOrDefaultBroker({
      configPath: '/consumer-check/missing.json',
      fallback: 'the-fallback',
    });

    expect(result).toBe('the-fallback');
  });
});
`;

// The unstaged \`fs\` call lives in the IMPLEMENTATION file, never directly in the \`.test.ts\` below —
// the trap's own \`jest.setup-io-trap.js\` explicitly EXEMPTS a call whose nearest repo frame is
// itself a \`.test.*.ts\` file (its \`TEST_INFRASTRUCTURE_FRAME\` regex — "a proxy's data is recorded
// from the real thing"), so \`accessSync\` called directly in the test file never trips it at all.
// Routing it through a plain function is what makes the caller's frame an ordinary implementation
// file, which is the shape the trap actually polices. The call goes through \`#gateway/node/fs\`, and
// \`accessSync\` is one of that subpath's RAW passthrough exports (\`export * from 'fs'\`): a WRAPPED
// export (\`readFileSync\`, \`existsSync\`) obliges the broker's proxy to construct the wrapper's own
// proxy, which stages a mock and would keep the call from ever reaching the trap. The return is the
// string LITERAL \`'accessible'\`, never a raw \`string\` or \`void\`.
const IO_TRAP_PROOF_SOURCE = `/**
 * PURPOSE: Checks a real path with fs.accessSync through the node gateway's raw passthrough, so no
 * wrapper proxy stages it. Exists only to prove the consumer's I/O trap fires on a native fs call no
 * test proxy ever staged.
 *
 * USAGE:
 * ioTrapProbeBroker();
 * // Returns 'accessible' when nothing traps the call; throws '[io-trap] unstaged fs.accessSync ...'
 * // when a unit test reaches it with nothing staged
 */

import { accessSync } from '#gateway/node/fs';

export const ioTrapProbeBroker = (): 'accessible' => {
  accessSync('/etc/hostname');
  return 'accessible';
};
`;

// Empty Proxy Pattern: this broker needs REAL, unmocked execution for the I/O trap proof to mean
// anything — mocking fs.accessSync here would stage the call and the trap would never fire.
// enforce-test-creation-of-proxy still requires SOME \`...Proxy()\` call inside the test block before
// a broker call, so the test below still constructs this proxy even though it stages nothing.
const IO_TRAP_PROOF_PROXY = `export const ioTrapProbeBrokerProxy = (): Record<PropertyKey, never> => ({});
`;

const IO_TRAP_PROOF_TEST = `import { ioTrapProbeBroker } from './io-trap-probe-broker';
import { ioTrapProbeBrokerProxy } from './io-trap-probe-broker.proxy';

describe('ioTrapProbeBroker', () => {
  it('ERROR: {call: unstaged fs.accessSync inside it} => throws the [io-trap] message', () => {
    ioTrapProbeBrokerProxy();

    expect(() => ioTrapProbeBroker()).toThrow(/^\\[io-trap\\] unstaged fs\\.accessSync/u);
  });
});
`;

// T01 (gateway-pivot 02176f3c5): the published jest base loads MSW in every consumer package and
// fails a test on anything unhandled. An unstaged \`fetch()\` REJECTS (MSW's own \`print.error()\` is
// what makes it do that), so the test's own \`rejects.toThrow()\` is a real assertion — jest's own
// "test has no assertions" rule (this same published base) would otherwise ALSO fail this test, for
// the wrong reason. \`start-endpoint-mock-setup.ts\`'s \`afterEach\` separately recorded the SAME
// unhandled request and asserts none was made, so the test fails a second, independent way too —
// which is the actual behaviour this sample proves, not merely the rejection. The return type is the
// string LITERAL \`'caught'\`, never the raw \`string\` keyword, so ban-primitives never sees it.
const MSW_TRAP_PROOF_SOURCE = `/**
 * PURPOSE: Requests a URL through the node gateway's http passthrough, staging nothing, to prove the
 * consumer's MSW setup fails a test on an unhandled request instead of letting it silently pass
 * through. \`http.get\` is a raw passthrough export, so no wrapper proxy stands between the call and MSW.
 *
 * USAGE:
 * await mswTrapProbeBroker();
 * // Rejects, and separately fails the test via MSW's own unhandled-request afterEach
 */

import { get } from '#gateway/node/http';

export const mswTrapProbeBroker = async (): Promise<'caught'> =>
  new Promise((resolve, reject) => {
    get('http://consumer-check.invalid/msw-trap-probe', (): void => {
      resolve('caught');
    }).on('error', reject);
  });
`;

const MSW_TRAP_PROOF_PROXY = `export const mswTrapProbeBrokerProxy = (): Record<PropertyKey, never> => ({});
`;

const MSW_TRAP_PROOF_TEST = `import { mswTrapProbeBroker } from './msw-trap-probe-broker';
import { mswTrapProbeBrokerProxy } from './msw-trap-probe-broker.proxy';

describe('mswTrapProbeBroker', () => {
  it('ERROR: {call: unstaged fetch inside it} => the suite fails on this test via MSW\\'s unhandled-request afterEach', async () => {
    mswTrapProbeBrokerProxy();

    await expect(mswTrapProbeBroker()).rejects.toThrow(/[\\s\\S]+/u);
  });
});
`;

// T03 (gateway-pivot): proves the PUBLISHED @dungeonmaster/testing really ships StartEndpointMock's
// optional contract param, and that a real installed zod schema checks a staged response against
// it — not just source resolution inside this repo's own checkout (EPIC rule 13: this item changes
// what @dungeonmaster/testing publishes). This is a genuinely PASSING test, unlike the io-trap/msw-
// trap probes above: the mismatched-data case throws synchronously inside resolves(), and the test's
// own expect(...).toThrow(...) catches it, the same shape as the hoisting proof's own passing test.
// It therefore lives in `lib`, not `probe` — `assertWardCleanFixture` sweeps `lib`/`app` and expects
// exit 0, which this file satisfies same as the hoisting proof does.
const CONTRACT_CHECK_PROOF_SOURCE = `/**
 * PURPOSE: Requests a mocked endpoint through the node gateway's http passthrough and returns its
 * parsed body. Exists only to prove StartEndpointMock.listen's optional contract param really rejects
 * a mismatched staged response, from a real installed @dungeonmaster/testing package, not just from
 * source resolution in this repo's own checkout.
 *
 * USAGE:
 * await contractCheckProbeBroker();
 * // Returns whatever JSON body the test staged through StartEndpointMock.listen
 */

import { get } from '#gateway/node/http';

export const contractCheckProbeBroker = async (): Promise<unknown> =>
  new Promise((resolve, reject) => {
    get('http://consumer-check.invalid/contract-check-probe', (response): void => {
      const parts: unknown[] = [];
      response.setEncoding('utf8');
      response.on('data', (chunk): void => {
        parts.push(chunk);
      });
      response.on('end', (): void => {
        resolve(JSON.parse(parts.join('')) as unknown);
      });
    }).on('error', reject);
  });
`;

// StartEndpointMock.listen is constructed in the CONSTRUCTOR, before the return statement, the same
// shape packages/web's own quest-comment-batch-broker.proxy.ts already uses for the identical call.
const CONTRACT_CHECK_PROOF_PROXY = `import { StartEndpointMock } from '@dungeonmaster/testing';
import { z } from '#gateway/npm/zod';

export const contractCheckProbeBrokerProxy = (): {
  stageValidResponse: () => void;
  stageMismatchedResponse: () => void;
} => {
  const endpoint = StartEndpointMock.listen({
    method: 'get',
    url: 'http://consumer-check.invalid/contract-check-probe',
    contract: z.object({ id: z.string().brand<'ContractCheckProbeId'>() }),
  });

  return {
    stageValidResponse: (): void => {
      endpoint.resolves({ data: { id: 'contract-check-probe-1' } });
    },
    stageMismatchedResponse: (): void => {
      endpoint.resolves({ data: { id: 42 } });
    },
  };
};
`;

const CONTRACT_CHECK_PROOF_TEST = `import { contractCheckProbeBroker } from './contract-check-probe-broker';
import { contractCheckProbeBrokerProxy } from './contract-check-probe-broker.proxy';

describe('contractCheckProbeBroker', () => {
  it('VALID: {contract, data matching it} => resolves stages it and fetch returns the parsed data', async () => {
    const proxy = contractCheckProbeBrokerProxy();
    proxy.stageValidResponse();

    const result = await contractCheckProbeBroker();

    expect(result).toStrictEqual({ id: 'contract-check-probe-1' });
  });

  it('INVALID: {contract, data that does not match it} => resolves throws at staging time, naming the mismatch', () => {
    const proxy = contractCheckProbeBrokerProxy();

    expect(() => proxy.stageMismatchedResponse()).toThrow(
      /Invalid input: expected string, received number/u,
    );
  });
});
`;

// A sample this function writes imports `#gateway/...` directly, the same way a real developer's own
// code would — and `gateway-dependency-declared` requires the IMPORTING package.json to list the real
// gateway package name in `dependencies`, exactly as it would for a human-authored file (repo
// `packages/CLAUDE.md`'s own dependency rule, enforced here by lint). `create-package` has no way to
// know in advance which gateway a package will end up importing, so this fixture — like a real
// developer would — adds the entry itself once the import exists.
const addGatewayDependencies = ({ consumerRoot, packageName, gateways, scope }) => {
  const packageJsonPath = join(consumerRoot, 'packages', packageName, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  packageJson.dependencies = {
    ...packageJson.dependencies,
    ...Object.fromEntries(gateways.map((gateway) => [`${scope}/${gateway}`, '*'])),
  };
  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
};

// The consumer's npm gateway starts with no wrapper, so the one npm package a sample needs (zod, for
// the contract-check proxy's schema) gets its own here, in the four-file shape the
// `consumerGatewayWrapper` session snippet names: the wrapper, its export-shape test, and a stub
// folder holding a stub plus that stub's own test — `gateway-colocation` refuses a subpath with any
// of them missing. Copied from this repo's own `packages/@gateway/npm/src/zod` shape.
const ZOD_WRAPPER_SOURCE = `/**
 * PURPOSE: Gateway entry for the npm package 'zod'. Every raw export passes through unchanged.
 *
 * USAGE:
 * import { z } from '#gateway/npm/zod';
 */

export * from 'zod';
export { default } from 'zod';
`;

const ZOD_WRAPPER_TEST = `import * as ourModule from './zod';
// A raw \`require\`, not \`import * as\`: TS's importStar helper synthesizes a .default onto any CJS
// module that lacks __esModule, so comparing against that synthetic shape would fail a pass-through.
import pkgModule = require('zod');

describe('#gateway/npm/zod', () => {
  it('VALID: {module} => re-exports the same runtime bindings as zod', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual(Object.keys(pkgModule).sort());
  });
});
`;

const ZOD_STRING_SCHEMA_STUB = `/**
 * PURPOSE: A real, branded Zod schema, built through the real \`z.string()\`.
 *
 * USAGE:
 * const schema = ZodStringSchemaStub();
 * schema.parse('gateway-stub'); // real, branded GatewayStubValue
 */
import { z } from 'zod';

export const ZodStringSchemaStub = (): z.ZodType<string> => z.string().brand<'GatewayStubValue'>();
`;

const ZOD_STRING_SCHEMA_STUB_TEST = `import { ZodStringSchemaStub } from './zod-string-schema.stub';

describe('ZodStringSchemaStub', () => {
  it('VALID: {} => a real schema that parses a real string', () => {
    expect(ZodStringSchemaStub().parse('gateway-stub')).toBe('gateway-stub');
  });

  it('INVALID: {} => a real schema that throws for a non-string', () => {
    expect(() => ZodStringSchemaStub().parse(123)).toThrow(/expected string, received number/u);
  });
});
`;

const writeZodGatewayWrapper = ({ consumerRoot }) => {
  const zodDir = join(consumerRoot, 'packages', '@gateway', 'npm', 'src', 'zod');
  const stubDir = join(zodDir, 'zod-string-schema');
  mkdirSync(stubDir, { recursive: true });
  writeFileSync(join(zodDir, 'zod.ts'), ZOD_WRAPPER_SOURCE);
  writeFileSync(join(zodDir, 'zod.test.ts'), ZOD_WRAPPER_TEST);
  writeFileSync(join(stubDir, 'zod-string-schema.stub.ts'), ZOD_STRING_SCHEMA_STUB);
  writeFileSync(join(stubDir, 'zod-string-schema.stub.test.ts'), ZOD_STRING_SCHEMA_STUB_TEST);
};

// `create-package`'s own gateway-scope detection (`works.mjs`'s `assertScopeDetection`, F5) and its
// scaffolded jest.config.js (`assertJestConfigBase`, F6) are both plain passing assertions against
// the `lib`/`app` packages this function scaffolds (never `probe` — F5/F6 need no known violation) —
// nothing here works around either one.
export const scaffoldFixturePackages = async ({ consumerRoot, cliBin, scope }) => {
  await runCreatePackage({ consumerRoot, cliBin, name: LIB_PACKAGE_NAME, type: 'library' });
  await runCreatePackage({ consumerRoot, cliBin, name: WEB_PACKAGE_NAME, type: 'frontend-react' });
  await runCreatePackage({ consumerRoot, cliBin, name: INK_PACKAGE_NAME, type: 'frontend-ink' });
  await runCreatePackage({ consumerRoot, cliBin, name: API_PACKAGE_NAME, type: 'http-backend' });
  await runCreatePackage({ consumerRoot, cliBin, name: MCP_PACKAGE_NAME, type: 'mcp-server' });
  await runCreatePackage({
    consumerRoot,
    cliBin,
    name: SERVICE_PACKAGE_NAME,
    type: 'programmatic-service',
  });
  await runCreatePackage({ consumerRoot, cliBin, name: PLUGIN_PACKAGE_NAME, type: 'eslint-plugin' });
  await runCreatePackage({ consumerRoot, cliBin, name: HOOKS_PACKAGE_NAME, type: 'hook-handlers' });
  await runCreatePackage({ consumerRoot, cliBin, name: CLI_PACKAGE_NAME, type: 'cli-tool' });
  await runCreatePackage({ consumerRoot, cliBin, name: PROBE_PACKAGE_NAME, type: 'library' });

  addGatewayDependencies({
    consumerRoot,
    packageName: LIB_PACKAGE_NAME,
    gateways: ['node', 'npm'],
    scope,
  });
  addGatewayDependencies({
    consumerRoot,
    packageName: PROBE_PACKAGE_NAME,
    gateways: ['node'],
    scope,
  });
  writeZodGatewayWrapper({ consumerRoot });

  const libSrcDir = join(consumerRoot, 'packages', LIB_PACKAGE_NAME, 'src');
  const probeSrcDir = join(consumerRoot, 'packages', PROBE_PACKAGE_NAME, 'src');

  const hoistDomainDir = join(libSrcDir, 'brokers', 'config', 'read-or-default');
  mkdirSync(hoistDomainDir, { recursive: true });
  writeFileSync(join(hoistDomainDir, 'config-read-or-default-broker.ts'), HOISTING_PROOF_SOURCE);
  writeFileSync(join(hoistDomainDir, 'config-read-or-default-broker.proxy.ts'), HOISTING_PROOF_PROXY);
  writeFileSync(join(hoistDomainDir, 'config-read-or-default-broker.test.ts'), HOISTING_PROOF_TEST);

  // Lives in `lib` beside the hoisting proof, not `probe` — see this constant's own comment above:
  // both of this file's tests PASS, so `assertWardCleanFixture`'s ward sweep over `lib` stays green.
  const contractCheckDomainDir = join(libSrcDir, 'brokers', 'contract-check', 'probe');
  mkdirSync(contractCheckDomainDir, { recursive: true });
  writeFileSync(
    join(contractCheckDomainDir, 'contract-check-probe-broker.ts'),
    CONTRACT_CHECK_PROOF_SOURCE,
  );
  writeFileSync(
    join(contractCheckDomainDir, 'contract-check-probe-broker.proxy.ts'),
    CONTRACT_CHECK_PROOF_PROXY,
  );
  writeFileSync(
    join(contractCheckDomainDir, 'contract-check-probe-broker.test.ts'),
    CONTRACT_CHECK_PROOF_TEST,
  );

  // Both probes live in `probe`, never `lib` — `assertWardCleanFixture` sweeps `lib`/`app` and
  // expects `dungeonmaster ward` to exit 0 there. These two ARE deliberately-failing tests (their
  // whole point is proving unstaged I/O trips the trap), so a general ward sweep of whatever
  // package holds them fails by design — exactly the same reason `probe`'s own ban-primitives
  // violation lives outside `lib`/`app`'s scope (see the lintViolationFile comment below).
  const ioTrapDomainDir = join(probeSrcDir, 'brokers', 'io-trap', 'probe');
  mkdirSync(ioTrapDomainDir, { recursive: true });
  writeFileSync(join(ioTrapDomainDir, 'io-trap-probe-broker.ts'), IO_TRAP_PROOF_SOURCE);
  writeFileSync(join(ioTrapDomainDir, 'io-trap-probe-broker.proxy.ts'), IO_TRAP_PROOF_PROXY);
  const ioTrapTestFile = join(ioTrapDomainDir, 'io-trap-probe-broker.test.ts');
  writeFileSync(ioTrapTestFile, IO_TRAP_PROOF_TEST);

  const mswTrapDomainDir = join(probeSrcDir, 'brokers', 'msw-trap', 'probe');
  mkdirSync(mswTrapDomainDir, { recursive: true });
  writeFileSync(join(mswTrapDomainDir, 'msw-trap-probe-broker.ts'), MSW_TRAP_PROOF_SOURCE);
  writeFileSync(join(mswTrapDomainDir, 'msw-trap-probe-broker.proxy.ts'), MSW_TRAP_PROOF_PROXY);
  const mswTrapTestFile = join(mswTrapDomainDir, 'msw-trap-probe-broker.test.ts');
  writeFileSync(mswTrapTestFile, MSW_TRAP_PROOF_TEST);

  // A known, ACTIVE violation (`@typescript-eslint/no-explicit-any`, a pre-edit rule that is on in
  // every consumer's config; `ban-primitives` is gone and its replacement is off), inside a fully colocated broker (header, proxy, test) so the ONLY thing lint
  // flags about it is the one deliberate violation `assertLint` expects — never a missing-companion
  // or missing-header finding this suite did not intend. Lives in the DEDICATED `probe` package, not
  // `lib` — `assertWardCleanFixture` scopes `dungeonmaster ward` onto `lib`/`app` and expects exit 0,
  // which a real violation inside `lib` would contradict.
  const lintViolationDomainDir = join(probeSrcDir, 'brokers', 'pre-edit', 'probe');
  mkdirSync(lintViolationDomainDir, { recursive: true });
  const lintViolationFile = join(lintViolationDomainDir, 'pre-edit-probe-broker.ts');
  writeFileSync(
    lintViolationFile,
    `/**
 * PURPOSE: Uppercases a path segment. Types the input as \`any\` on purpose, so this fixture carries
 * a real @typescript-eslint/no-explicit-any violation for the consumer's lint to catch.
 *
 * USAGE:
 * preEditProbeBroker({ path: 'a/b' });
 * // Returns 'A/B' — lint flags the parameter type itself, not this call
 */

export const preEditProbeBroker = ({ path }: { path: any }): unknown => path.toUpperCase();
`,
  );
  writeFileSync(
    join(lintViolationDomainDir, 'pre-edit-probe-broker.proxy.ts'),
    'export const preEditProbeBrokerProxy = (): Record<PropertyKey, never> => ({});\n',
  );
  writeFileSync(
    join(lintViolationDomainDir, 'pre-edit-probe-broker.test.ts'),
    `import { preEditProbeBroker } from './pre-edit-probe-broker';
import { preEditProbeBrokerProxy } from './pre-edit-probe-broker.proxy';

describe('preEditProbeBroker', () => {
  it('VALID: {path: "a/b"} => returns the uppercased path', () => {
    preEditProbeBrokerProxy();

    expect(preEditProbeBroker({ path: 'a/b' })).toBe('A/B');
  });
});
`,
  );

  return {
    libDir: join(consumerRoot, 'packages', LIB_PACKAGE_NAME),
    webDir: join(consumerRoot, 'packages', WEB_PACKAGE_NAME),
    probeDir: join(consumerRoot, 'packages', PROBE_PACKAGE_NAME),
    ioTrapTestFile,
    mswTrapTestFile,
    lintViolationFile,
  };
};
