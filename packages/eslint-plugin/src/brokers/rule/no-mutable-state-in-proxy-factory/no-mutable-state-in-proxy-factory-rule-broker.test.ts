import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { noMutableStateInProxyFactoryRuleBroker } from './no-mutable-state-in-proxy-factory-rule-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('no-mutable-state-in-proxy-factory', noMutableStateInProxyFactoryRuleBroker(), {
  valid: [
    // ✅ CORRECT - Using const for jest.mocked()
    {
      code: `
        import axios from 'axios';
        jest.mock('axios');

        export const httpAdapterProxy = () => {
          const mock = jest.mocked(axios);
          return { returns: () => {} };
        };
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
    },
    // ✅ CORRECT - Using const for child proxy
    {
      code: `
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';

        export const userBrokerProxy = () => {
          const httpProxy = httpAdapterProxy();
          return { setup: () => {} };
        };
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
    },
    // ✅ CORRECT - Multiple const declarations
    {
      code: `
        import axios from 'axios';
        import { readFile } from 'fs/promises';
        jest.mock('axios');
        jest.mock('fs/promises');

        export const multiAdapterProxy = () => {
          const axiosMock = jest.mocked(axios);
          const fsMock = jest.mocked(readFile);
          return { returns: () => {} };
        };
      `,
      filename: '/project/src/adapters/multi/multi-adapter.proxy.ts',
    },
    // ✅ CORRECT - Multiple child proxies with const
    {
      code: `
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';
        import { dbAdapterProxy } from '../../adapters/db/db-adapter.proxy';

        export const userBrokerProxy = () => {
          const httpProxy = httpAdapterProxy();
          const dbProxy = dbAdapterProxy();
          return { setup: () => {} };
        };
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
    },
    // ✅ CORRECT - Only const declarations
    {
      code: `
        import axios from 'axios';
        jest.mock('axios');

        export const httpAdapterProxy = () => {
          const config = { timeout: 5000 };
          const mock = jest.mocked(axios);
          return { returns: () => {} };
        };
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
    },
    // Skip non-proxy files
    {
      code: `
        export const helper = () => {
          let counter = 0;
          return () => counter++;
        };
      `,
      filename: '/project/src/helpers/counter.ts',
    },
  ],
  invalid: [
    // ❌ WRONG - let at module level
    {
      code: `
        let moduleState = 0;

        export const httpAdapterProxy = () => {
          const mock = jest.mocked(axios);
          return { returns: () => {} };
        };
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [{ messageId: 'noMutableState' }],
    },
    // ❌ WRONG - var at module level
    {
      code: `
        var otherState = 'test';

        export const httpAdapterProxy = () => {
          const mock = jest.mocked(axios);
          return { returns: () => {} };
        };
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [{ messageId: 'noMutableState' }],
    },
    // ❌ WRONG - Multiple let/var at module level
    {
      code: `
        let moduleState = 0;
        var otherState = 'test';

        export const httpAdapterProxy = () => {
          const mock = jest.mocked(axios);
          return { returns: () => {} };
        };
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [{ messageId: 'noMutableState' }, { messageId: 'noMutableState' }],
    },
    // ❌ WRONG - let with non-allowed initializer
    {
      code: `
        export const httpAdapterProxy = () => {
          let counter = 0;
          return { returns: () => {} };
        };
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [{ messageId: 'noMutableState' }],
    },
    // ❌ WRONG - var with non-allowed initializer
    {
      code: `
        export const httpAdapterProxy = () => {
          var state = { value: 0 };
          return { returns: () => {} };
        };
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [{ messageId: 'noMutableState' }],
    },
    // ❌ WRONG - let without initializer
    {
      code: `
        export const httpAdapterProxy = () => {
          let result;
          return { returns: () => {} };
        };
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [{ messageId: 'noMutableState' }],
    },
    // ❌ WRONG - var without initializer
    {
      code: `
        export const httpAdapterProxy = () => {
          var data;
          return { returns: () => {} };
        };
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [{ messageId: 'noMutableState' }],
    },
    // ❌ WRONG - let with string literal
    {
      code: `
        export const userBrokerProxy = () => {
          let userId = 'user-123';
          return { setup: () => {} };
        };
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
      errors: [{ messageId: 'noMutableState' }],
    },
    // ❌ WRONG - let with number literal
    {
      code: `
        export const counterProxy = () => {
          let count = 0;
          return { increment: () => count++ };
        };
      `,
      filename: '/project/src/state/counter/counter-state.proxy.ts',
      errors: [{ messageId: 'noMutableState' }],
    },
    // ❌ WRONG - let with object literal
    {
      code: `
        export const stateProxy = () => {
          let cache = { items: [] };
          return { get: () => cache };
        };
      `,
      filename: '/project/src/state/cache/cache-state.proxy.ts',
      errors: [{ messageId: 'noMutableState' }],
    },
    // ❌ WRONG - let with array literal
    {
      code: `
        export const listProxy = () => {
          let items = [];
          return { add: (item) => items.push(item) };
        };
      `,
      filename: '/project/src/state/list/list-state.proxy.ts',
      errors: [{ messageId: 'noMutableState' }],
    },
    // ❌ WRONG - Multiple let/var declarations
    {
      code: `
        export const httpAdapterProxy = () => {
          let counter = 0;
          var state = {};
          let data = [];
          return { returns: () => {} };
        };
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [
        { messageId: 'noMutableState' },
        { messageId: 'noMutableState' },
        { messageId: 'noMutableState' },
      ],
    },
    // ❌ WRONG - let with jest.mocked() (should use const)
    {
      code: `
        import axios from 'axios';
        jest.mock('axios');

        export const httpAdapterProxy = () => {
          let mock = jest.mocked(axios);
          return { returns: () => {} };
        };
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [{ messageId: 'noMutableState' }],
    },
    // ❌ WRONG - var with jest.mocked() (should use const)
    {
      code: `
        import axios from 'axios';
        jest.mock('axios');

        export const httpAdapterProxy = () => {
          var mock = jest.mocked(axios);
          return { returns: () => {} };
        };
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [{ messageId: 'noMutableState' }],
    },
    // ❌ WRONG - let with child proxy (should use const)
    {
      code: `
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';

        export const userBrokerProxy = () => {
          let httpProxy = httpAdapterProxy();
          return { setup: () => {} };
        };
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
      errors: [{ messageId: 'noMutableState' }],
    },
    // ❌ WRONG - var with child proxy (should use const)
    {
      code: `
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';

        export const userBrokerProxy = () => {
          var httpProxy = httpAdapterProxy();
          return { setup: () => {} };
        };
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
      errors: [{ messageId: 'noMutableState' }],
    },
    // ❌ WRONG - Multiple let declarations
    {
      code: `
        import axios from 'axios';
        jest.mock('axios');

        export const httpAdapterProxy = () => {
          let mock = jest.mocked(axios);
          let counter = 0;
          return { returns: () => {} };
        };
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [{ messageId: 'noMutableState' }, { messageId: 'noMutableState' }],
    },
    // ❌ WRONG - let with function call (not jest.mocked or proxy)
    {
      code: `
        export const httpAdapterProxy = () => {
          let result = someFunction();
          return { returns: () => {} };
        };
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [{ messageId: 'noMutableState' }],
    },
    // ❌ WRONG - let with new expression
    {
      code: `
        export const httpAdapterProxy = () => {
          let instance = new SomeClass();
          return { returns: () => {} };
        };
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [{ messageId: 'noMutableState' }],
    },
    // ❌ WRONG - var with boolean
    {
      code: `
        export const featureProxy = () => {
          var enabled = true;
          return { toggle: () => {} };
        };
      `,
      filename: '/project/src/state/feature/feature-state.proxy.ts',
      errors: [{ messageId: 'noMutableState' }],
    },
    // ❌ WRONG - let with null
    {
      code: `
        export const userProxy = () => {
          let currentUser = null;
          return { setUser: () => {} };
        };
      `,
      filename: '/project/src/state/user/user-state.proxy.ts',
      errors: [{ messageId: 'noMutableState' }],
    },
    // ❌ WRONG - Multiple declarations in one statement
    {
      code: `
        export const multiProxy = () => {
          let a = 1, b = 2, c = 3;
          return { returns: () => {} };
        };
      `,
      filename: '/project/src/state/multi/multi-state.proxy.ts',
      errors: [
        { messageId: 'noMutableState' },
        { messageId: 'noMutableState' },
        { messageId: 'noMutableState' },
      ],
    },
    // ❌ WRONG - let inside nested block
    {
      code: `
        export const httpAdapterProxy = () => {
          if (true) {
            let temp = 'test';
          }
          return { returns: () => {} };
        };
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [{ messageId: 'noMutableState' }],
    },
    // ❌ WRONG - var inside nested function
    {
      code: `
        export const httpAdapterProxy = () => {
          const helper = () => {
            var local = 'value';
          };
          return { returns: () => {} };
        };
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [{ messageId: 'noMutableState' }],
    },
    // ❌ WRONG - let in non-Proxy function (but still in .proxy.ts file)
    {
      code: `
        export const createAdapter = () => {
          let state = {};
          return { get: () => state };
        };
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [{ messageId: 'noMutableState' }],
    },
  ],
});
