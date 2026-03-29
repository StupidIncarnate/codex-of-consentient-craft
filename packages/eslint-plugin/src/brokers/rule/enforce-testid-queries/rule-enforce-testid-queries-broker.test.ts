import { ruleEnforceTestidQueriesBroker } from './rule-enforce-testid-queries-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('enforce-testid-queries', ruleEnforceTestidQueriesBroker(), {
  valid: [
    // TestId queries are allowed
    {
      code: "screen.getByTestId('USER_NAME');",
      filename: '/project/src/widgets/user/user-widget.test.tsx',
    },
    {
      code: "screen.queryByTestId('OPTIONAL_ELEM');",
      filename: '/project/src/widgets/user/user-widget.test.tsx',
    },
    {
      code: "screen.findByTestId('ASYNC_ELEM');",
      filename: '/project/src/widgets/user/user-widget.test.tsx',
    },

    // Role queries are allowed
    {
      code: "screen.getByRole('button', { name: /submit/i });",
      filename: '/project/src/widgets/user/user-widget.test.tsx',
    },
    {
      code: "screen.getAllByRole('listitem');",
      filename: '/project/src/widgets/user/user-widget.test.tsx',
    },

    // Non-test files are not checked
    {
      code: "container.querySelector('.class');",
      filename: '/project/src/widgets/user/user-widget.proxy.tsx',
    },
    {
      code: "screen.getByText('Submit');",
      filename: '/project/src/widgets/user/user-widget.tsx',
    },
  ],
  invalid: [
    // Content-based screen queries
    {
      code: "screen.getByText('Submit');",
      filename: '/project/src/widgets/user/user-widget.test.tsx',
      errors: [
        {
          messageId: 'contentBasedQuery',
          data: {
            method: 'screen.getByText',
            replacement: 'screen.getByTestId',
          },
        },
      ],
    },
    {
      code: "screen.queryByAltText('logo');",
      filename: '/project/src/widgets/user/user-widget.test.tsx',
      errors: [
        {
          messageId: 'contentBasedQuery',
          data: {
            method: 'screen.queryByAltText',
            replacement: 'screen.queryByTestId',
          },
        },
      ],
    },
    {
      code: "screen.findAllByPlaceholderText('Search...');",
      filename: '/project/src/widgets/search/search-widget.test.tsx',
      errors: [
        {
          messageId: 'contentBasedQuery',
          data: {
            method: 'screen.findAllByPlaceholderText',
            replacement: 'screen.findAllByTestId',
          },
        },
      ],
    },
    {
      code: "screen.getByLabelText('Email');",
      filename: '/project/src/widgets/form/form-widget.test.tsx',
      errors: [
        {
          messageId: 'contentBasedQuery',
          data: {
            method: 'screen.getByLabelText',
            replacement: 'screen.getByTestId',
          },
        },
      ],
    },

    // Non-tsx test file (still checked)
    {
      code: "screen.getByText('Submit');",
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'contentBasedQuery',
          data: {
            method: 'screen.getByText',
            replacement: 'screen.getByTestId',
          },
        },
      ],
    },

    // Container queries
    {
      code: "container.querySelector('.my-class');",
      filename: '/project/src/widgets/user/user-widget.test.tsx',
      errors: [
        {
          messageId: 'containerQuery',
          data: { method: 'querySelector' },
        },
      ],
    },
    {
      code: "container.querySelectorAll('div');",
      filename: '/project/src/widgets/user/user-widget.test.tsx',
      errors: [
        {
          messageId: 'containerQuery',
          data: { method: 'querySelectorAll' },
        },
      ],
    },
  ],
});
