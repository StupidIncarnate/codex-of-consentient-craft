import { ruleBanFetchInProxiesBroker } from './rule-ban-fetch-in-proxies-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('ban-fetch-in-proxies', ruleBanFetchInProxiesBroker(), {
  valid: [
    // StartEndpointMock usage in proxy files is allowed
    {
      code: 'StartEndpointMock.listen();',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.proxy.ts',
    },

    // globalThis.fetch in non-proxy files is allowed
    {
      code: 'globalThis.fetch("https://example.com");',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
    },

    // fetch() in non-proxy files is allowed
    {
      code: 'fetch("https://example.com");',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
    },

    // jest.spyOn(globalThis, 'fetch') in non-proxy files is allowed
    {
      code: "jest.spyOn(globalThis, 'fetch');",
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
    },

    // globalThis.fetch in test files is allowed
    {
      code: 'globalThis.fetch("https://example.com");',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.test.ts',
    },

    // jest.spyOn on non-fetch properties in proxy files is allowed
    {
      code: "jest.spyOn(globalThis, 'setTimeout');",
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.proxy.ts',
    },

    // jest.spyOn on non-globalThis objects in proxy files is allowed
    {
      code: "jest.spyOn(Date, 'now');",
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.proxy.ts',
    },

    // globalThis with non-fetch properties in proxy files is allowed
    {
      code: 'globalThis.setTimeout(() => {}, 100);',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.proxy.ts',
    },

    // Non-proxy tsx files are allowed
    {
      code: 'fetch("https://example.com");',
      filename: '/project/src/widgets/user/user-widget.tsx',
    },
  ],
  invalid: [
    // globalThis.fetch in proxy file
    {
      code: 'globalThis.fetch("https://example.com");',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.proxy.ts',
      errors: [
        {
          messageId: 'noFetchInProxy',
        },
      ],
    },

    // jest.spyOn(globalThis, 'fetch') in proxy file
    {
      code: "jest.spyOn(globalThis, 'fetch');",
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.proxy.ts',
      errors: [
        {
          messageId: 'noFetchInProxy',
        },
      ],
    },

    // Direct fetch() call in proxy file
    {
      code: 'fetch("https://example.com");',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.proxy.ts',
      errors: [
        {
          messageId: 'noFetchInProxy',
        },
      ],
    },

    // globalThis.fetch in proxy tsx file
    {
      code: 'globalThis.fetch("https://example.com");',
      filename: '/project/src/widgets/user/user-widget.proxy.tsx',
      errors: [
        {
          messageId: 'noFetchInProxy',
        },
      ],
    },

    // Direct fetch() in proxy tsx file
    {
      code: 'fetch("https://example.com");',
      filename: '/project/src/widgets/user/user-widget.proxy.tsx',
      errors: [
        {
          messageId: 'noFetchInProxy',
        },
      ],
    },

    // jest.spyOn(globalThis, 'fetch') with mockImplementation in proxy file
    {
      code: "jest.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(new Response()));",
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.proxy.ts',
      errors: [
        {
          messageId: 'noFetchInProxy',
        },
      ],
    },

    // Multiple violations in same proxy file
    {
      code: `globalThis.fetch("https://example.com");
fetch("https://other.com");
jest.spyOn(globalThis, 'fetch');`,
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.proxy.ts',
      errors: [
        {
          messageId: 'noFetchInProxy',
        },
        {
          messageId: 'noFetchInProxy',
        },
        {
          messageId: 'noFetchInProxy',
        },
      ],
    },
  ],
});
