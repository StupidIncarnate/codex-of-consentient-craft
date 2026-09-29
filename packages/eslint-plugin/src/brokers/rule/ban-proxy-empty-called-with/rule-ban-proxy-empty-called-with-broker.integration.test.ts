import { typedRuleTesterHarness } from '../../../../test/harnesses/typed-rule-tester/typed-rule-tester.harness';
import { ruleBanProxyEmptyCalledWithBroker } from './rule-ban-proxy-empty-called-with-broker';

// Real files on disk that the fixture tsconfig below names — only the FILENAME need be real, the
// linted text is synthetic. Built by slicing `__dirname`'s own segments, not `path.join`/
// `path.resolve`: this file is a test-scenario file, and
// `@dungeonmaster/ban-node-builtins-in-test-scenarios` refuses a Node builtin import here.
const DIR_SEGMENTS = __dirname.split('/');
// .../packages/eslint-plugin/src/brokers/rule/ban-proxy-empty-called-with — 6 up is the repo root
const REPO_ROOT = DIR_SEGMENTS.slice(0, -6).join('/');
const PROXY_FILE = `${REPO_ROOT}/packages/eslint-plugin/src/brokers/rule/ban-fetch-in-proxies/rule-ban-fetch-in-proxies-broker.proxy.ts`;
const NON_PROXY_FILE = `${REPO_ROOT}/packages/eslint-plugin/src/statics/regex-match-methods/regex-match-methods-statics.ts`;

// `parserOptions.project` points at a two-file fixture tsconfig instead of `true`: `true` resolves
// to the package's own tsconfig, whose program holds every source file of the package, while the
// rule only asks the checker for a callee's signature. Those two anchors are the only files the
// cases use.
const FIXTURE_TSCONFIG = `${REPO_ROOT}/packages/eslint-plugin/test/fixtures/ban-proxy-empty-called-with/tsconfig.node.json`;
const languageOptionsFor = ({ project }: { project: string }): unknown => ({
  parserOptions: { project },
});
const LANGUAGE_OPTIONS = languageOptionsFor({ project: FIXTURE_TSCONFIG });

const ruleTester = typedRuleTesterHarness();

ruleTester.run('ban-proxy-empty-called-with', ruleBanProxyEmptyCalledWithBroker(), {
  valid: [
    // randomUUID takes no required argument — calledWith([]) is the honest description
    {
      code: `import { randomUUID } from 'crypto';
const handle = registerMock({ fn: randomUUID });
handle.calledWith([]).returns('id');`,
      filename: PROXY_FILE,
      languageOptions: LANGUAGE_OPTIONS,
    },
    // Addressed by the real argument, even though readFileSync requires one
    {
      code: `import { readFileSync } from 'fs';
const handle = registerMock({ fn: readFileSync });
handle.calledWith(['/a/b.json']).returns('content');`,
      filename: PROXY_FILE,
      languageOptions: LANGUAGE_OPTIONS,
    },
    // calledWith([]) on a handle never built from registerMock in this file is untracked
    {
      code: `const handle = { calledWith: (matchArgs) => ({ returns: (value) => value }) };
handle.calledWith([]).returns('x');`,
      filename: PROXY_FILE,
      languageOptions: LANGUAGE_OPTIONS,
    },
    // Non-proxy files are outside this rule's scope regardless of fn's signature
    {
      code: `import { readFileSync } from 'fs';
const handle = registerMock({ fn: readFileSync });
handle.calledWith([]).returns('');`,
      filename: NON_PROXY_FILE,
      languageOptions: LANGUAGE_OPTIONS,
    },
    // A void-sink recorder: the proxy reads the handle's calls back, so it is not a catch-all
    {
      code: `const spy = registerSpyOn({ object: process.stderr, method: 'write' });
spy.calledWith([]).returns(true);
export const proxy = () => ({ getWrites: () => spy.callsMatching([]).map((call) => call[0]) });`,
      filename: PROXY_FILE,
      languageOptions: LANGUAGE_OPTIONS,
    },
    {
      code: `const spy = registerSpyOn({ object: process.stdout, method: 'write' });
spy.calledWith([]).returns(true);
export const proxy = () => ({ getWrites: () => spy.mock.calls });`,
      filename: PROXY_FILE,
      languageOptions: LANGUAGE_OPTIONS,
    },
    {
      code: `const handle = registerSpyOn({ object: process, method: 'on' });
handle.calledWith([]).returns(process);
export const proxy = () => ({ callsMatching: () => handle.callsMatching([]) });`,
      filename: PROXY_FILE,
      languageOptions: LANGUAGE_OPTIONS,
    },
    // A spied method that takes no argument: calledWith([]) is the honest description
    {
      code: `const spy = registerSpyOn({ object: process, method: 'cwd' });
spy.calledWith([]).returns('/repo');`,
      filename: PROXY_FILE,
      languageOptions: LANGUAGE_OPTIONS,
    },
    // A spy addressed by the real argument tuple, even though write requires an argument
    {
      code: `const spy = registerSpyOn({ object: process.stderr, method: 'write' });
spy.calledWith(['text']).returns(true);`,
      filename: PROXY_FILE,
      languageOptions: LANGUAGE_OPTIONS,
    },
    // A spy on a property with no call signature is unresolvable, so it is not reported
    {
      code: `const spy = registerSpyOn({ object: process, method: 'pid' });
spy.calledWith([]).returns(1);`,
      filename: PROXY_FILE,
      languageOptions: LANGUAGE_OPTIONS,
    },
    // Non-proxy files are outside this rule's scope for spies too
    {
      code: `const spy = registerSpyOn({ object: process.stderr, method: 'write' });
spy.calledWith([]).returns(true);`,
      filename: NON_PROXY_FILE,
      languageOptions: LANGUAGE_OPTIONS,
    },
  ],
  invalid: [
    // ward's own stderr spy: write requires its first argument, so [] matches every call
    {
      code: `const spy = registerSpyOn({ object: process.stderr, method: 'write' });
spy.calledWith([]).returns(true);`,
      filename: PROXY_FILE,
      languageOptions: LANGUAGE_OPTIONS,
      errors: [{ messageId: 'emptyCalledWithRequiresArgs' }],
    },
    // The same void-sink spies with no read-back stay catch-alls
    {
      code: `const spy = registerSpyOn({ object: process.stdout, method: 'write' });
spy.calledWith([]).returns(true);`,
      filename: PROXY_FILE,
      languageOptions: LANGUAGE_OPTIONS,
      errors: [{ messageId: 'emptyCalledWithRequiresArgs' }],
    },
    {
      code: `const handle = registerSpyOn({ object: process, method: 'on' });
handle.calledWith([]).returns(process);`,
      filename: PROXY_FILE,
      languageOptions: LANGUAGE_OPTIONS,
      errors: [{ messageId: 'emptyCalledWithRequiresArgs' }],
    },
    // Reading back a different handle does not exempt this one
    {
      code: `const spy = registerSpyOn({ object: process.stderr, method: 'write' });
const other = registerSpyOn({ object: process.stdout, method: 'write' });
spy.calledWith([]).returns(true);
export const proxy = () => ({ calls: () => other.callsMatching([]) });`,
      filename: PROXY_FILE,
      languageOptions: LANGUAGE_OPTIONS,
      errors: [{ messageId: 'emptyCalledWithRequiresArgs' }],
    },
    // The exception is only for process sinks: a write spy on any other object is a catch-all
    {
      code: `const socket = { write: (chunk: string): boolean => chunk.length > 0 };
const spy = registerSpyOn({ object: socket, method: 'write' });
spy.calledWith([]).returns(true);
export const proxy = () => ({ calls: () => spy.callsMatching([]) });`,
      filename: PROXY_FILE,
      languageOptions: LANGUAGE_OPTIONS,
      errors: [{ messageId: 'emptyCalledWithRequiresArgs' }],
    },
    // passthrough spies are still spies: an empty address is still a catch-all
    {
      code: `const spy = registerSpyOn({ object: process.stdout, method: 'write', passthrough: true });
spy.calledWith([]).returns(true);`,
      filename: PROXY_FILE,
      languageOptions: LANGUAGE_OPTIONS,
      errors: [{ messageId: 'emptyCalledWithRequiresArgs' }],
    },
    {
      code: `import { readFileSync } from 'fs';
const handle = registerMock({ fn: readFileSync });
handle.calledWith([]).returns('');`,
      filename: PROXY_FILE,
      languageOptions: LANGUAGE_OPTIONS,
      errors: [{ messageId: 'emptyCalledWithRequiresArgs' }],
    },
    // Shorthand `{ fn }` property form
    {
      code: `import { readFile } from 'fs/promises';
const fn = readFile;
const handle = registerMock({ fn });
handle.calledWith([]).resolves('');`,
      filename: PROXY_FILE,
      languageOptions: LANGUAGE_OPTIONS,
      errors: [{ messageId: 'emptyCalledWithRequiresArgs' }],
    },
  ],
});
