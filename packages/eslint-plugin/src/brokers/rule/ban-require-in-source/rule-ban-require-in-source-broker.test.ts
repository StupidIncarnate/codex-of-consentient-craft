import { ruleBanRequireInSourceBroker } from './rule-ban-require-in-source-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('ban-require-in-source', ruleBanRequireInSourceBroker(), {
  valid: [
    // --- requireActual is a different identifier; allowed for test mock setup ---
    {
      code: "const mod = requireActual({ module: 'foo' });",
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },
    {
      code: "requireActual({ module: '../bar/bar-state' });",
      filename: '/project/src/flows/orchestration/orchestration-flow.integration.test.ts',
    },

    // --- ES import statements are allowed ---
    {
      code: "import x from 'foo';",
      filename: '/project/src/brokers/user/user-broker.ts',
    },
    {
      code: "import { y } from './bar';",
      filename: '/project/src/brokers/user/user-broker.ts',
    },

    // --- Dynamic import() is allowed (not a `require` Identifier) ---
    {
      code: "const mod = await import('foo');",
      filename: '/project/src/brokers/user/user-broker.ts',
    },
  ],

  invalid: [
    // --- Raw require() call ---
    {
      code: "require('foo');",
      filename: '/project/src/brokers/user/user-broker.ts',
      errors: [{ messageId: 'noRequire' }],
    },
    // --- Raw require() assigned to a binding ---
    {
      code: "const x = require('../bar');",
      filename: '/project/src/brokers/user/user-broker.ts',
      errors: [{ messageId: 'noRequire' }],
    },
    // --- Raw require() in a test file ---
    {
      code: "const events = require('../../state/orchestration-events/orchestration-events-state');",
      filename: '/project/src/flows/orchestration/orchestration-flow.integration.test.ts',
      errors: [{ messageId: 'noRequire' }],
    },
  ],
});
