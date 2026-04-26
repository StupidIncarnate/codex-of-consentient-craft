import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleNoBareProcessCwdBroker } from './rule-no-bare-process-cwd-broker';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('no-bare-process-cwd (defaults)', ruleNoBareProcessCwdBroker(), {
  valid: [
    // VALID: process.cwd() in default-allowed file (start-install.ts)
    {
      code: 'const dir = process.cwd();',
      filename: '/repo/packages/cli/src/startup/start-install.ts',
    },
    // VALID: process.cwd() inside default-allowed folder (adapters/process/cwd/)
    {
      code: 'export const processCwdAdapter = () => process.cwd();',
      filename: '/repo/packages/shared/src/adapters/process/cwd/process-cwd-adapter.ts',
    },
    // VALID: process.cwd() in *.test.ts when allowTestFiles is true (default)
    {
      code: 'const dir = process.cwd();',
      filename: '/repo/packages/server/src/foo/bar.test.ts',
    },
    // VALID: process.cwd() in *.integration.test.ts when allowTestFiles is true
    {
      code: 'const dir = process.cwd();',
      filename: '/repo/packages/server/src/foo/bar.integration.test.ts',
    },
    // VALID: process.cwd() in *.harness.ts when allowTestFiles is true
    {
      code: 'const dir = process.cwd();',
      filename: '/repo/packages/testing/src/test/harnesses/foo.harness.ts',
    },
    // VALID: process.cwd() in *.proxy.ts when allowTestFiles is true
    {
      code: 'const dir = process.cwd();',
      filename: '/repo/packages/server/src/brokers/foo/bar.proxy.ts',
    },
    // VALID: code that does not call process.cwd()
    {
      code: 'const dir = process.env.HOME;',
      filename: '/repo/packages/server/src/brokers/foo/foo-broker.ts',
    },
    // VALID: foo.cwd() (different object) is not flagged
    {
      code: 'const dir = foo.cwd();',
      filename: '/repo/packages/server/src/brokers/foo/foo-broker.ts',
    },
  ],
  invalid: [
    // INVALID: process.cwd() in a regular broker source file
    {
      code: 'const dir = process.cwd();',
      filename: '/repo/packages/server/src/brokers/foo/foo-broker.ts',
      errors: [{ messageId: 'bareProcessCwd' }],
    },
    // INVALID: process.cwd() in a transformer
    {
      code: 'export const fooTransformer = () => process.cwd();',
      filename: '/repo/packages/web/src/transformers/foo/foo-transformer.ts',
      errors: [{ messageId: 'bareProcessCwd' }],
    },
    // INVALID: multiple process.cwd() calls in the same file
    {
      code: `
        const a = process.cwd();
        const b = process.cwd();
      `,
      filename: '/repo/packages/server/src/responders/foo/foo-responder.ts',
      errors: [{ messageId: 'bareProcessCwd' }, { messageId: 'bareProcessCwd' }],
    },
    // INVALID: process.cwd() in an adapter that is NOT under adapters/process/cwd/
    {
      code: 'const dir = process.cwd();',
      filename: '/repo/packages/server/src/adapters/glob/find/glob-find-adapter.ts',
      errors: [{ messageId: 'bareProcessCwd' }],
    },
  ],
});

ruleTester.run(
  'no-bare-process-cwd (custom allowedFiles overrides defaults)',
  ruleNoBareProcessCwdBroker(),
  {
    valid: [
      // VALID: file matches the custom allowedFiles pattern
      {
        code: 'const dir = process.cwd();',
        filename: '/repo/packages/cli/bin/cli-entry.ts',
        options: [{ allowedFiles: ['**/bin/cli-entry.ts'], allowedFolders: [] }],
      },
    ],
    invalid: [
      // INVALID: default-allowed file no longer matches when custom allowedFiles overrides
      {
        code: 'const dir = process.cwd();',
        filename: '/repo/packages/cli/src/startup/start-install.ts',
        options: [{ allowedFiles: ['**/bin/cli-entry.ts'], allowedFolders: [] }],
        errors: [{ messageId: 'bareProcessCwd' }],
      },
      // INVALID: default-allowed folder no longer matches when custom allowedFolders overrides
      {
        code: 'const dir = process.cwd();',
        filename: '/repo/packages/shared/src/adapters/process/cwd/process-cwd-adapter.ts',
        options: [{ allowedFiles: ['**/bin/cli-entry.ts'], allowedFolders: [] }],
        errors: [{ messageId: 'bareProcessCwd' }],
      },
    ],
  },
);

describe('ruleNoBareProcessCwdBroker', () => {
  it('EDGE: empty filename short-circuits, returns no listeners', () => {
    const rule = ruleNoBareProcessCwdBroker();
    const context = EslintContextStub({
      filename: '' as never,
      getFilename: ((): never => '' as never) as never,
    });

    const listeners = rule.create(context);

    expect(listeners).toStrictEqual({});
  });
});

ruleTester.run('no-bare-process-cwd (allowTestFiles: false)', ruleNoBareProcessCwdBroker(), {
  valid: [],
  invalid: [
    // INVALID: process.cwd() in *.test.ts when allowTestFiles is explicitly disabled
    {
      code: 'const dir = process.cwd();',
      filename: '/repo/packages/server/src/foo/bar.test.ts',
      options: [{ allowTestFiles: false }],
      errors: [{ messageId: 'bareProcessCwd' }],
    },
    // INVALID: process.cwd() in *.harness.ts when allowTestFiles is explicitly disabled
    {
      code: 'const dir = process.cwd();',
      filename: '/repo/packages/testing/src/test/harnesses/foo.harness.ts',
      options: [{ allowTestFiles: false }],
      errors: [{ messageId: 'bareProcessCwd' }],
    },
  ],
});
