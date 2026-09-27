/**
 * Scaffolds the consumer's own application fixture packages using the INSTALLED `dungeonmaster
 * create-package` — never a hand-written package.json/tsconfig/jest.config (packages/CLAUDE.md's
 * own "do not hand-copy configs off a sibling"): `lib` (packageType `library`) proves the NODE
 * gateway platform end to end — a broker importing a gateway proxy from its own file, proving
 * `registerMock` hoists, and a broker making a raw unstaged `fs` call, proving the I/O trap fires —
 * and `app` (packageType `frontend-react`) proves the BROWSER gateway platform and `init`'s own
 * e2e-eligibility detection sees a real frontend-react package in this fixture.
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
// path: the gateway's bare \`"./*"\` export key resolves ONE captured segment to that folder's
// barrel file (\`src/fs__promises/fs__promises.ts\`), so \`#gateway/node/fs__promises\` is the whole
// legal specifier — \`.../read-file-if-exists/read-file-if-exists\` is TS2307 (confirmed against a
// real run of this suite). Only \`.proxy\`/\`.stub\` specifically use the deep per-file form, via the
// gateway's OTHER two export keys (concession 1) — see the proxy import two lines below.
const HOISTING_PROOF_SOURCE = `import { readFileIfExists } from '#gateway/node/fs__promises';

export const readConfigOrDefault = async ({
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

// Imports the proxy from ITS OWN file (concession 1 / brands doc C6 — no \`_test_\` barrel), and
// registers the mock AFTER \`readConfigOrDefault\` is already imported above: if \`registerMock\`'s
// AST transformer did not hoist it ahead of every import, \`fs/promises.readFile\` would already be
// bound to the real implementation by the time \`.calledWith(...)\` runs — the classic hoisting proof.
const HOISTING_PROOF_TEST = `import { readConfigOrDefault } from './read-config-or-default';
import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';

describe('readConfigOrDefault', () => {
  it('VALID: {configPath: staged file} => returns the mocked contents, proving the proxy mock hoisted', async () => {
    const proxy = readFileIfExistsProxy();
    proxy.returns({ path: '/consumer-check/config.json', contents: 'from-hoisted-mock' });

    const result = await readConfigOrDefault({
      configPath: '/consumer-check/config.json',
      fallback: 'unused-fallback',
    });

    expect(result).toBe('from-hoisted-mock');
  });

  it('EMPTY: {configPath: missing file} => returns the fallback', async () => {
    const proxy = readFileIfExistsProxy();
    proxy.missing({ path: '/consumer-check/missing.json' });

    const result = await readConfigOrDefault({
      configPath: '/consumer-check/missing.json',
      fallback: 'the-fallback',
    });

    expect(result).toBe('the-fallback');
  });
});
`;

// The unstaged \`fs\` call lives in the IMPLEMENTATION file, never directly in the \`.test.ts\` below —
// the trap's own \`jest.setup-io-trap.js\` explicitly EXEMPTS a call whose nearest repo frame is
// itself a \`.test.\\*.ts\` file (its \`TEST_INFRASTRUCTURE_FRAME\` regex — "a proxy's data is recorded
// from the real thing"), so \`readFileSync\` called directly in the test file never trips it at all
// (confirmed against a real run of this suite: "Received function did not throw"). Routing it
// through a plain broker is what makes the caller's frame an ordinary implementation file, which is
// the shape the trap actually polices.
const IO_TRAP_PROOF_SOURCE = `import { readFileSync } from 'fs';

export const ioTrapProbe = (): string => readFileSync('/etc/hostname', 'utf8');
`;

const IO_TRAP_PROOF_TEST = `import { ioTrapProbe } from './io-trap-probe';

describe('ioTrapProbe', () => {
  it('ERROR: {call: unstaged fs.readFileSync inside it} => throws the [io-trap] message', () => {
    expect(() => ioTrapProbe()).toThrow(/^\\[io-trap\\] unstaged fs\\.readFileSync/u);
  });
});
`;

// T01 (gateway-pivot 02176f3c5): the published jest base loads MSW in every consumer package and
// fails a test on anything unhandled. An unstaged \`fetch()\` REJECTS (MSW's own \`print.error()\` is
// what makes it do that), so the test's own \`rejects.toThrow()\` is a real assertion — jest's own
// "test has no assertions" rule (this same published base) would otherwise ALSO fail this test, for
// the wrong reason. \`start-endpoint-mock-setup.ts\`'s \`afterEach\` separately recorded the SAME
// unhandled request and asserts none was made, so the test fails a second, independent way too —
// which is the actual behaviour this sample proves, not merely the rejection.
const MSW_TRAP_PROOF_SOURCE = `export const mswTrapProbe = async (): Promise<'caught'> => {
  await fetch('http://consumer-check.invalid/msw-trap-probe');
  return 'caught';
};
`;

const MSW_TRAP_PROOF_TEST = `import { mswTrapProbe } from './msw-trap-probe';

describe('mswTrapProbe', () => {
  it('ERROR: {call: unstaged fetch inside it} => the suite fails on this test via MSW\\'s unhandled-request afterEach', async () => {
    await expect(mswTrapProbe()).rejects.toThrow();
  });
});
`;

// `create-package`'s own gateway-scope detection has a real bug for a scaffolded consumer (see
// `works.mjs`'s `assertAndPatchScopeDetectionBug`, which both ASSERTS it — so the finding stays
// visible in this suite's own report — and patches the two packages this function scaffolds so the
// checks that run after it measure the rest of the stack rather than cascading on one already-
// reported cause). Nothing here works around it silently.
export const scaffoldFixturePackages = async ({ consumerRoot, cliBin }) => {
  await runCreatePackage({ consumerRoot, cliBin, name: LIB_PACKAGE_NAME, type: 'library' });
  await runCreatePackage({ consumerRoot, cliBin, name: WEB_PACKAGE_NAME, type: 'frontend-react' });

  const libSrcDir = join(consumerRoot, 'packages', LIB_PACKAGE_NAME, 'src');

  const hoistDomainDir = join(libSrcDir, 'brokers', 'read-config-or-default');
  mkdirSync(hoistDomainDir, { recursive: true });
  writeFileSync(join(hoistDomainDir, 'read-config-or-default.ts'), HOISTING_PROOF_SOURCE);
  writeFileSync(join(hoistDomainDir, 'read-config-or-default.test.ts'), HOISTING_PROOF_TEST);

  const ioTrapDomainDir = join(libSrcDir, 'brokers', 'io-trap-probe');
  mkdirSync(ioTrapDomainDir, { recursive: true });
  writeFileSync(join(ioTrapDomainDir, 'io-trap-probe.ts'), IO_TRAP_PROOF_SOURCE);
  const ioTrapTestFile = join(ioTrapDomainDir, 'io-trap-probe.test.ts');
  writeFileSync(ioTrapTestFile, IO_TRAP_PROOF_TEST);

  const mswTrapDomainDir = join(libSrcDir, 'brokers', 'msw-trap-probe');
  mkdirSync(mswTrapDomainDir, { recursive: true });
  writeFileSync(join(mswTrapDomainDir, 'msw-trap-probe.ts'), MSW_TRAP_PROOF_SOURCE);
  const mswTrapTestFile = join(mswTrapDomainDir, 'msw-trap-probe.test.ts');
  writeFileSync(mswTrapTestFile, MSW_TRAP_PROOF_TEST);

  // A known, ACTIVE violation (`ban-primitives`: a function returning a raw `string` instead of a
  // branded type) — placed INSIDE the scaffolded `lib` package (not at the bare consumer root),
  // because ESLint's `parserOptions.project` only covers files a real tsconfig `include`s; a file
  // sitting outside every package's tsconfig fails to PARSE at all (confirmed against a real run of
  // this suite), which is a different, useless kind of "error" than the one this check wants.
  const lintViolationDomainDir = join(libSrcDir, 'brokers', 'pre-edit-probe');
  mkdirSync(lintViolationDomainDir, { recursive: true });
  const lintViolationFile = join(lintViolationDomainDir, 'pre-edit-probe-broker.ts');
  writeFileSync(
    lintViolationFile,
    "export const preEditProbeBroker = ({ path }: { path: string }): string => path.toUpperCase();\n",
  );

  return {
    libDir: join(consumerRoot, 'packages', LIB_PACKAGE_NAME),
    webDir: join(consumerRoot, 'packages', WEB_PACKAGE_NAME),
    ioTrapTestFile,
    mswTrapTestFile,
    lintViolationFile,
  };
};
