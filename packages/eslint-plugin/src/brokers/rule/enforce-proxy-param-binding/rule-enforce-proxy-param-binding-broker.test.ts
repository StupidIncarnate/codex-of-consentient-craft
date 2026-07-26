import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleEnforceProxyParamBindingBroker } from './rule-enforce-proxy-param-binding-broker';

const ruleTester = eslintRuleTesterAdapter();
const PROXY_FILENAME = '/project/src/adapters/fs/read-file/fs-read-file-adapter.proxy.ts';
const NON_PROXY_FILENAME = '/project/src/adapters/fs/read-file/fs-read-file-adapter.ts';

ruleTester.run('enforce-proxy-param-binding', ruleEnforceProxyParamBindingBroker(), {
  valid: [
    // Every declared property is destructured
    {
      code: 'const returns = ({ filepath, contents }: { filepath: string; contents: string }) => {};',
      filename: PROXY_FILENAME,
    },

    // Renamed binding still binds the source property name
    {
      code: 'const returns = ({ filepath: path }: { filepath: string }) => { path; };',
      filename: PROXY_FILENAME,
    },

    // Rest element consumes every remaining declared property
    {
      code: 'const returns = ({ filepath, ...rest }: { filepath: string; contents: string }) => {};',
      filename: PROXY_FILENAME,
    },

    // Non-object-pattern params are ignored entirely
    {
      code: 'const returns = (filepath: string) => {};',
      filename: PROXY_FILENAME,
    },
    {
      code: 'const returns = ([a, b]: [string, string]) => {};',
      filename: PROXY_FILENAME,
    },

    // No type annotation — nothing to compare against
    {
      code: 'const returns = ({ filepath }) => {};',
      filename: PROXY_FILENAME,
    },

    // Type is a reference, not an inline literal — out of scope (no type resolution)
    {
      code: 'const returns = ({ filepath }: FilepathArgs) => {};',
      filename: PROXY_FILENAME,
    },

    // Function declarations and function expressions with fully-bound patterns
    {
      code: 'function returns({ filepath }: { filepath: string }) {}',
      filename: PROXY_FILENAME,
    },
    {
      code: 'const obj = { returns: function ({ filepath }: { filepath: string }) {} };',
      filename: PROXY_FILENAME,
    },

    // Same unbound shape, but outside a .proxy.ts file — rule does not apply
    {
      code: 'const returns = ({ contents }: { filepath: string; contents: string }) => {};',
      filename: NON_PROXY_FILENAME,
    },

    // No params at all
    {
      code: 'const setup = () => {};',
      filename: PROXY_FILENAME,
    },
  ],
  invalid: [
    // The motivating example: filepath declared, only contents bound
    {
      code: 'const returns = ({ contents }: { filepath: string; contents: string }) => {};',
      filename: PROXY_FILENAME,
      errors: [{ messageId: 'unboundProxyParam', data: { propertyName: 'filepath' } }],
    },

    // Multiple unbound properties in one type literal
    {
      code: 'const returns = ({}: { filepath: string; contents: string }) => {};',
      filename: PROXY_FILENAME,
      errors: [
        { messageId: 'unboundProxyParam', data: { propertyName: 'filepath' } },
        { messageId: 'unboundProxyParam', data: { propertyName: 'contents' } },
      ],
    },

    // Renaming a DIFFERENT property does not bind the unbound one
    {
      code: 'const returns = ({ contents: renamed }: { filepath: string; contents: string }) => {};',
      filename: PROXY_FILENAME,
      errors: [{ messageId: 'unboundProxyParam', data: { propertyName: 'filepath' } }],
    },

    // Multiple params — only the second has an unbound property
    {
      code: 'const setup = ({ a }: { a: string }, { b }: { b: string; c: string }) => {};',
      filename: PROXY_FILENAME,
      errors: [{ messageId: 'unboundProxyParam', data: { propertyName: 'c' } }],
    },

    // Function declaration form
    {
      code: 'function returns({ contents }: { filepath: string; contents: string }) {}',
      filename: PROXY_FILENAME,
      errors: [{ messageId: 'unboundProxyParam', data: { propertyName: 'filepath' } }],
    },

    // Function expression (object method) form
    {
      code: 'const obj = { returns: function ({ contents }: { filepath: string; contents: string }) {} };',
      filename: PROXY_FILENAME,
      errors: [{ messageId: 'unboundProxyParam', data: { propertyName: 'filepath' } }],
    },

    // .proxy.tsx files are covered too
    {
      code: 'const returns = ({ contents }: { filepath: string; contents: string }) => {};',
      filename: '/project/src/widgets/user/user-widget.proxy.tsx',
      errors: [{ messageId: 'unboundProxyParam', data: { propertyName: 'filepath' } }],
    },
  ],
});
