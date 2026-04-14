import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleEnforceFolderReturnTypesBroker } from './rule-enforce-folder-return-types-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('enforce-folder-return-types', ruleEnforceFolderReturnTypesBroker(), {
  valid: [
    // Adapter returning Promise<string> — valid
    {
      code: `export const fetchDataAdapter = (): Promise<string> => Promise.resolve('data');`,
      filename: '/project/src/adapters/fs/write-file/fs-write-file-adapter.ts',
    },
    // Adapter returning Promise<{ success: boolean }> — valid
    {
      code: `export const writeFileAdapter = (): Promise<{ success: boolean }> => Promise.resolve({ success: true });`,
      filename: '/project/src/adapters/fs/write-file/fs-write-file-adapter.ts',
    },
    // Adapter returning AdapterResult — valid
    {
      code: `export const readFileAdapter = (): AdapterResult => ({ data: 'ok' });`,
      filename: '/project/src/adapters/fs/read-file/fs-read-file-adapter.ts',
    },
    // Guard returning boolean — valid
    {
      code: `export const isValidGuard = (): boolean => true;`,
      filename: '/project/src/guards/is-valid/is-valid-guard.ts',
    },
    // Guard returning type predicate — valid
    {
      code: `export const isStringGuard = (value: unknown): value is string => typeof value === 'string';`,
      filename: '/project/src/guards/is-string/is-string-guard.ts',
    },
    // Broker returning Promise<void> — NOT in adapters/ folder, should pass
    {
      code: `export const fetchUserBroker = (): Promise<void> => Promise.resolve();`,
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
    },
    // Transformer returning string — NOT in guards/ folder, should pass
    {
      code: `export const formatTransformer = (): string => 'formatted';`,
      filename: '/project/src/transformers/format/format-transformer.ts',
    },
    // Adapter without return type annotation — skipped (explicit-return-types handles this)
    {
      code: `export const noReturnTypeAdapter = () => Promise.resolve();`,
      filename: '/project/src/adapters/fs/write-file/fs-write-file-adapter.ts',
    },
    // Guard without return type annotation — skipped (explicit-return-types handles this)
    {
      code: `export const noReturnTypeGuard = () => true;`,
      filename: '/project/src/guards/is-valid/is-valid-guard.ts',
    },
    // Adapter function declaration without return type — skipped
    {
      code: `export function writeFileAdapter() { return Promise.resolve(); }`,
      filename: '/project/src/adapters/fs/write-file/fs-write-file-adapter.ts',
    },
    // Guard function declaration without return type — skipped
    {
      code: `export function isValidGuard() { return true; }`,
      filename: '/project/src/guards/is-valid/is-valid-guard.ts',
    },
    // Non-exported function returning void in adapter file — not matched by selectors
    {
      code: `const internalHelper = (): void => {};`,
      filename: '/project/src/adapters/fs/write-file/fs-write-file-adapter.ts',
    },
  ],
  invalid: [
    // Adapter returning void
    {
      code: `export const writeFileAdapter = (): void => {};`,
      filename: '/project/src/adapters/fs/write-file/fs-write-file-adapter.ts',
      errors: [{ messageId: 'adapterVoidReturn' }],
    },
    // Adapter returning Promise<void>
    {
      code: `export const writeFileAdapter = (): Promise<void> => Promise.resolve();`,
      filename: '/project/src/adapters/fs/write-file/fs-write-file-adapter.ts',
      errors: [{ messageId: 'adapterPromiseVoidReturn' }],
    },
    // Guard returning void
    {
      code: `export const isValidGuard = (): void => {};`,
      filename: '/project/src/guards/is-valid/is-valid-guard.ts',
      errors: [{ messageId: 'guardMustReturnBoolean' }],
    },
    // Guard returning string
    {
      code: `export const isValidGuard = (): string => 'yes';`,
      filename: '/project/src/guards/is-valid/is-valid-guard.ts',
      errors: [{ messageId: 'guardMustReturnBoolean' }],
    },
    // Guard returning Promise<boolean>
    {
      code: `export const isValidGuard = (): Promise<boolean> => Promise.resolve(true);`,
      filename: '/project/src/guards/is-valid/is-valid-guard.ts',
      errors: [{ messageId: 'guardMustReturnBoolean' }],
    },
    // Guard returning number
    {
      code: `export const isValidGuard = (): number => 1;`,
      filename: '/project/src/guards/is-valid/is-valid-guard.ts',
      errors: [{ messageId: 'guardMustReturnBoolean' }],
    },
  ],
});
