/**
 * Scaffolds the consumer's own application fixture packages using the INSTALLED `dungeonmaster
 * create-package` — never a hand-written package.json/tsconfig/jest.config (packages/CLAUDE.md's
 * own "do not hand-copy configs off a sibling"): `lib` (packageType `library`) proves the NODE
 * gateway platform end to end — a broker importing a gateway proxy from its own file, proving
 * `registerMock` hoists, and an adapter making a raw unstaged `fs` call, proving the I/O trap fires —
 * and `app` (packageType `frontend-react`) proves the BROWSER gateway platform and `init`'s own
 * e2e-eligibility detection sees a real frontend-react package in this fixture.
 *
 * Every sample below follows THIS repo's own architecture exactly (get-architecture,
 * get-testing-patterns, get-folder-detail: brokers, adapters) — the 2-level
 * `<folderType>/<domain-or-package>/<action>/` depth `create-package`'s own seed uses, a
 * PURPOSE/USAGE header on every implementation file, and a colocated `.proxy.ts` + `.test.ts`
 * beside each one — the same rules a real consumer's own lint enforces on its own code, so the
 * fixture never trips a violation THIS suite does not intend. A raw `fs` import and a `void` return
 * are both banned inside `brokers/` (confirmed against the pre-edit hook), so the one sample that
 * needs a real unwrapped `fs` call is an ADAPTER instead — the folder type node_modules imports are
 * legal in.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { run } from './proc.mjs';

export const LIB_PACKAGE_NAME = 'lib';
export const WEB_PACKAGE_NAME = 'app';

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
// OTHER two export keys (concession 1). The return is a branded `ContentText`, never a raw `string`
// — `ban-primitives` bans a raw string return everywhere outside the gateway itself, and a broker
// this suite writes has to obey the same rule a real consumer's lint enforces.
const HOISTING_PROOF_SOURCE = `/**
 * PURPOSE: Reads a config file through the node gateway and falls back to a default value when the
 * file is missing. Proves a broker resolves the gateway's fs__promises BARREL import
 * (\`#gateway/node/fs__promises\`), the group-barrel form every wrapped call outside \`.proxy\`/\`.stub\`
 * uses, rather than a wrapper's own deep per-file path.
 *
 * USAGE:
 * await configReadOrDefaultBroker({ configPath: '/repo/.dungeonmaster.json', fallback: '{}' });
 * // Returns the file's contents, or the fallback, both branded ContentText
 */

import { readFileIfExists } from '#gateway/node/fs__promises';
import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';

export const configReadOrDefaultBroker = async ({
  configPath,
  fallback,
}: {
  configPath: string;
  fallback: string;
}): Promise<ContentText> => {
  const contents = await readFileIfExists(configPath);
  return contentTextContract.parse(contents === null ? fallback : contents);
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
// from the real thing"), so \`readFileSync\` called directly in the test file never trips it at all
// (confirmed against a real run of this suite: "Received function did not throw"). Routing it
// through a plain function is what makes the caller's frame an ordinary implementation file, which
// is the shape the trap actually polices. A raw \`fs\` import is banned inside \`brokers/\` (confirmed
// against the pre-edit hook: "brokers/ cannot import external package \\"fs\\"") and a broker may not
// return \`void\` either — \`adapters/\` is the one folder type node_modules imports are legal in, so
// this sample is an adapter, returning a branded \`ContentText\`, never a raw string or void.
const IO_TRAP_PROOF_SOURCE = `/**
 * PURPOSE: Reads a real file with fs.readFileSync, wrapped as an adapter so a raw node fs call is
 * legal here — adapters/ is the one folder type allowed to import node_modules directly. Exists
 * only to prove the consumer's I/O trap fires on a native fs call no test proxy ever staged.
 *
 * USAGE:
 * fsIoTrapProbeAdapter();
 * // Returns the branded ContentText of /etc/hostname when a test HAS staged this call; throws
 * // '[io-trap] unstaged fs.readFileSync ...' when nothing staged it
 */

import { readFileSync } from 'fs';
import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';

export const fsIoTrapProbeAdapter = (): ContentText =>
  contentTextContract.parse(readFileSync('/etc/hostname', 'utf8'));
`;

// Empty Proxy Pattern: this adapter needs REAL, unmocked execution for the I/O trap proof to mean
// anything — mocking fs.readFileSync here would stage the call and the trap would never fire.
// enforce-test-creation-of-proxy still requires SOME \`...Proxy()\` call inside the test block before
// an \`...Adapter\` call, so the test below still constructs this proxy even though it stages nothing.
const IO_TRAP_PROOF_PROXY = `export const fsIoTrapProbeAdapterProxy = (): Record<PropertyKey, never> => ({});
`;

const IO_TRAP_PROOF_TEST = `import { fsIoTrapProbeAdapter } from './fs-io-trap-probe-adapter';
import { fsIoTrapProbeAdapterProxy } from './fs-io-trap-probe-adapter.proxy';

describe('fsIoTrapProbeAdapter', () => {
  it('ERROR: {call: unstaged fs.readFileSync inside it} => throws the [io-trap] message', () => {
    fsIoTrapProbeAdapterProxy();

    expect(() => fsIoTrapProbeAdapter()).toThrow(/^\\[io-trap\\] unstaged fs\\.readFileSync/u);
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
 * PURPOSE: Calls the global fetch() directly, staging nothing, to prove the consumer's MSW setup
 * fails a test on an unhandled request instead of letting it silently pass through.
 *
 * USAGE:
 * await mswTrapProbeBroker();
 * // Rejects, and separately fails the test via MSW's own unhandled-request afterEach
 */

export const mswTrapProbeBroker = async (): Promise<'caught'> => {
  await fetch('http://consumer-check.invalid/msw-trap-probe');
  return 'caught';
};
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

// `create-package`'s own gateway-scope detection (`works.mjs`'s `assertScopeDetection`, F5) and its
// scaffolded jest.config.js (`assertJestConfigBase`, F6) are both plain passing assertions against
// the two packages this function scaffolds — nothing here works around either one.
export const scaffoldFixturePackages = async ({ consumerRoot, cliBin }) => {
  await runCreatePackage({ consumerRoot, cliBin, name: LIB_PACKAGE_NAME, type: 'library' });
  await runCreatePackage({ consumerRoot, cliBin, name: WEB_PACKAGE_NAME, type: 'frontend-react' });

  const libSrcDir = join(consumerRoot, 'packages', LIB_PACKAGE_NAME, 'src');

  const hoistDomainDir = join(libSrcDir, 'brokers', 'config', 'read-or-default');
  mkdirSync(hoistDomainDir, { recursive: true });
  writeFileSync(join(hoistDomainDir, 'config-read-or-default-broker.ts'), HOISTING_PROOF_SOURCE);
  writeFileSync(join(hoistDomainDir, 'config-read-or-default-broker.proxy.ts'), HOISTING_PROOF_PROXY);
  writeFileSync(join(hoistDomainDir, 'config-read-or-default-broker.test.ts'), HOISTING_PROOF_TEST);

  const ioTrapDomainDir = join(libSrcDir, 'adapters', 'fs', 'io-trap-probe');
  mkdirSync(ioTrapDomainDir, { recursive: true });
  writeFileSync(join(ioTrapDomainDir, 'fs-io-trap-probe-adapter.ts'), IO_TRAP_PROOF_SOURCE);
  writeFileSync(join(ioTrapDomainDir, 'fs-io-trap-probe-adapter.proxy.ts'), IO_TRAP_PROOF_PROXY);
  const ioTrapTestFile = join(ioTrapDomainDir, 'fs-io-trap-probe-adapter.test.ts');
  writeFileSync(ioTrapTestFile, IO_TRAP_PROOF_TEST);

  const mswTrapDomainDir = join(libSrcDir, 'brokers', 'msw-trap', 'probe');
  mkdirSync(mswTrapDomainDir, { recursive: true });
  writeFileSync(join(mswTrapDomainDir, 'msw-trap-probe-broker.ts'), MSW_TRAP_PROOF_SOURCE);
  writeFileSync(join(mswTrapDomainDir, 'msw-trap-probe-broker.proxy.ts'), MSW_TRAP_PROOF_PROXY);
  const mswTrapTestFile = join(mswTrapDomainDir, 'msw-trap-probe-broker.test.ts');
  writeFileSync(mswTrapTestFile, MSW_TRAP_PROOF_TEST);

  // A known, ACTIVE violation (`ban-primitives`: a function returning a raw `string` instead of a
  // branded type), inside a fully colocated broker (header, proxy, test) so the ONLY thing lint
  // flags about it is the one deliberate violation `assertLint` expects — never a missing-companion
  // or missing-header finding this suite did not intend.
  const lintViolationDomainDir = join(libSrcDir, 'brokers', 'pre-edit', 'probe');
  mkdirSync(lintViolationDomainDir, { recursive: true });
  const lintViolationFile = join(lintViolationDomainDir, 'pre-edit-probe-broker.ts');
  writeFileSync(
    lintViolationFile,
    `/**
 * PURPOSE: Uppercases a path segment. Returns a raw string instead of a branded type on purpose, so
 * this fixture carries a real ban-primitives violation for the consumer's lint to catch.
 *
 * USAGE:
 * preEditProbeBroker({ path: 'a/b' });
 * // Returns 'A/B' — lint flags the return type itself, not this call
 */

export const preEditProbeBroker = ({ path }: { path: string }): string => path.toUpperCase();
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
    ioTrapTestFile,
    mswTrapTestFile,
    lintViolationFile,
  };
};
