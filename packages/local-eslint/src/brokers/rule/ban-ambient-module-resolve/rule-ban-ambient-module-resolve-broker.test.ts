import { ruleBanAmbientModuleResolveBroker } from './rule-ban-ambient-module-resolve-broker';
import { ruleTesterHarness } from '@dungeonmaster/eslint-plugin/rule-tester.harness';

const ruleTester = ruleTesterHarness();

const brokerFile = '/repo/packages/cli/src/brokers/a/b/a-b-broker.ts';
const sanctionedFile = '/repo/packages/shared/src/brokers/module/resolve/module-resolve-broker.ts';

ruleTester.run('ban-ambient-module-resolve', ruleBanAmbientModuleResolveBroker(), {
  valid: [
    { code: "require.resolve('@dungeonmaster/cli');", filename: sanctionedFile },
    {
      code: "require.resolve('@dungeonmaster/cli', { paths: [root] });",
      filename: sanctionedFile,
    },
    {
      code: "require.resolve('@dungeonmaster/cli');",
      filename: '/repo/packages/cli/src/brokers/a/b/a-b-broker.test.ts',
    },
    {
      code: "require.resolve('@dungeonmaster/cli');",
      filename: '/repo/packages/cli/src/brokers/a/b/a-b-broker.proxy.ts',
    },
    {
      code: "require.resolve('@dungeonmaster/cli');",
      filename: '/repo/packages/@gateway/node/src/module/resolve/resolve.ts',
    },
    // `require` itself is owned by other rules
    { code: "require('x');", filename: brokerFile },
    // A method of the same name on another object is a different function
    { code: "foo.resolve('x');", filename: brokerFile },
    { code: 'resolve();', filename: brokerFile },
    { code: "require['resolve']('x');", filename: brokerFile },
  ],
  invalid: [
    {
      code: "require.resolve('@dungeonmaster/cli');",
      filename: brokerFile,
      errors: [{ messageId: 'ambientModuleResolve' }],
    },
    {
      code: "require.resolve('@dungeonmaster/cli', { paths: [root] });",
      filename: brokerFile,
      errors: [{ messageId: 'ambientModuleResolve' }],
    },
    {
      code: "const bin = join(dirname(require.resolve('@dungeonmaster/cli/package.json')), 'dist');",
      filename: brokerFile,
      errors: [{ messageId: 'ambientModuleResolve' }],
    },
    {
      code: "require.resolve('a'); require.resolve('b');",
      filename: brokerFile,
      errors: [{ messageId: 'ambientModuleResolve' }, { messageId: 'ambientModuleResolve' }],
    },
  ],
});
