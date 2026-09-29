import { typedRuleTesterHarness } from '../../../../test/harnesses/typed-rule-tester/typed-rule-tester.harness';
import { ruleBanProxyEmptyCalledWithBroker } from './rule-ban-proxy-empty-called-with-broker';

// Real files on disk, so `parserOptions.project: true` resolves each one to this package's own
// real tsconfig.json by walking the real directory tree. See packages/eslint-plugin/CLAUDE.md:
// "RuleTester tests work fine anywhere (they use synthetic code strings, not real files)" — only
// the FILENAME need be real. Built by slicing `__dirname`'s own segments, not `path.join`/
// `path.resolve`: this file is a test-scenario file, and
// `@dungeonmaster/ban-node-builtins-in-test-scenarios` refuses a Node builtin import here.
const DIR_SEGMENTS = __dirname.split('/');
// .../packages/eslint-plugin/src/brokers/rule/ban-proxy-empty-called-with — 6 up is the repo root
const REPO_ROOT = DIR_SEGMENTS.slice(0, -6).join('/');
const PROXY_FILE = `${REPO_ROOT}/packages/eslint-plugin/src/brokers/rule/ban-fetch-in-proxies/rule-ban-fetch-in-proxies-broker.proxy.ts`;
const NON_PROXY_FILE = `${REPO_ROOT}/packages/eslint-plugin/src/brokers/rule/ban-fetch-in-proxies/rule-ban-fetch-in-proxies-broker.ts`;

const ruleTester = typedRuleTesterHarness();

ruleTester.run('ban-proxy-empty-called-with', ruleBanProxyEmptyCalledWithBroker(), {
  valid: [
    // randomUUID takes no required argument — calledWith([]) is the honest description
    {
      code: `import { randomUUID } from 'crypto';
const handle = registerMock({ fn: randomUUID });
handle.calledWith([]).returns('id');`,
      filename: PROXY_FILE,
    },
    // Addressed by the real argument, even though readFileSync requires one
    {
      code: `import { readFileSync } from 'fs';
const handle = registerMock({ fn: readFileSync });
handle.calledWith(['/a/b.json']).returns('content');`,
      filename: PROXY_FILE,
    },
    // calledWith([]) on a handle never built from registerMock in this file is untracked
    {
      code: `const handle = { calledWith: (matchArgs) => ({ returns: (value) => value }) };
handle.calledWith([]).returns('x');`,
      filename: PROXY_FILE,
    },
    // Non-proxy files are outside this rule's scope regardless of fn's signature
    {
      code: `import { readFileSync } from 'fs';
const handle = registerMock({ fn: readFileSync });
handle.calledWith([]).returns('');`,
      filename: NON_PROXY_FILE,
    },
    // A spied method that takes no argument: calledWith([]) is the honest description
    {
      code: `const spy = registerSpyOn({ object: process, method: 'cwd' });
spy.calledWith([]).returns('/repo');`,
      filename: PROXY_FILE,
    },
    // A spy addressed by the real argument tuple, even though write requires an argument
    {
      code: `const spy = registerSpyOn({ object: process.stderr, method: 'write' });
spy.calledWith(['text']).returns(true);`,
      filename: PROXY_FILE,
    },
    // A spy on a property with no call signature is unresolvable, so it is not reported
    {
      code: `const spy = registerSpyOn({ object: process, method: 'pid' });
spy.calledWith([]).returns(1);`,
      filename: PROXY_FILE,
    },
    // Non-proxy files are outside this rule's scope for spies too
    {
      code: `const spy = registerSpyOn({ object: process.stderr, method: 'write' });
spy.calledWith([]).returns(true);`,
      filename: NON_PROXY_FILE,
    },
  ],
  invalid: [
    // ward's own stderr spy: write requires its first argument, so [] matches every call
    {
      code: `const spy = registerSpyOn({ object: process.stderr, method: 'write' });
spy.calledWith([]).returns(true);`,
      filename: PROXY_FILE,
      errors: [{ messageId: 'emptyCalledWithRequiresArgs' }],
    },
    // passthrough spies are still spies: an empty address is still a catch-all
    {
      code: `const spy = registerSpyOn({ object: process.stdout, method: 'write', passthrough: true });
spy.calledWith([]).returns(true);`,
      filename: PROXY_FILE,
      errors: [{ messageId: 'emptyCalledWithRequiresArgs' }],
    },
    {
      code: `import { readFileSync } from 'fs';
const handle = registerMock({ fn: readFileSync });
handle.calledWith([]).returns('');`,
      filename: PROXY_FILE,
      errors: [{ messageId: 'emptyCalledWithRequiresArgs' }],
    },
    // Shorthand `{ fn }` property form
    {
      code: `import { readFile } from 'fs/promises';
const fn = readFile;
const handle = registerMock({ fn });
handle.calledWith([]).resolves('');`,
      filename: PROXY_FILE,
      errors: [{ messageId: 'emptyCalledWithRequiresArgs' }],
    },
  ],
});
