import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleEnforceFolderReturnTypesBroker } from './rule-enforce-folder-return-types-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('enforce-folder-return-types', ruleEnforceFolderReturnTypesBroker(), {
  valid: [
    {
      code: `export const fetchDataAdapter = (): Promise<string> => Promise.resolve('data');`,
      filename: '/project/src/adapters/fs/read-file/fs-read-file-adapter.ts',
    },
    {
      code: `export const writeFileAdapter = (): Promise<{ success: boolean }> => Promise.resolve({ success: true });`,
      filename: '/project/src/adapters/fs/write-file/fs-write-file-adapter.ts',
    },
    {
      code: `export const readFileAdapter = (): AdapterResult => ({ data: 'ok' });`,
      filename: '/project/src/adapters/fs/read-file/fs-read-file-adapter.ts',
    },
    {
      code: `export const useGuildsBinding = (): { data: Guild[]; loading: boolean } => ({ data: [], loading: false });`,
      filename: '/project/src/bindings/use-guilds/use-guilds-binding.ts',
    },
    {
      code: `export const fetchUserBroker = (): Promise<User> => Promise.resolve({} as User);`,
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
    },
    {
      code: `export const CliFlow = (): Promise<number> => Promise.resolve(0);`,
      filename: '/project/src/flows/cli/cli-flow.ts',
    },
    {
      code: `export const isValidGuard = (): boolean => true;`,
      filename: '/project/src/guards/is-valid/is-valid-guard.ts',
    },
    {
      code: `export const isStringGuard = (value: unknown): value is string => typeof value === 'string';`,
      filename: '/project/src/guards/is-string/is-string-guard.ts',
    },
    {
      code: `export const authMiddleware = (): AuthResult => ({ allowed: true });`,
      filename: '/project/src/middleware/auth/auth-middleware.ts',
    },
    {
      code: `export const HandleResponder = (): Promise<ResponderResult> => Promise.resolve({} as ResponderResult);`,
      filename: '/project/src/responders/chat/start/chat-start-responder.ts',
    },
    {
      code: `export const sessionsState = (): SessionStore => ({ sessions: [] });`,
      filename: '/project/src/state/sessions/sessions-state.ts',
    },
    {
      code: `export const formatTransformer = (): string => 'formatted';`,
      filename: '/project/src/transformers/format/format-transformer.ts',
    },
    {
      code: `export const PixelBtnWidget = (): React.JSX.Element => null as unknown as React.JSX.Element;`,
      filename: '/project/src/widgets/pixel-btn/pixel-btn-widget.tsx',
    },
    {
      code: `export const StartServer = (): Promise<ServerHandle> => Promise.resolve({} as ServerHandle);`,
      filename: '/project/src/startup/start-server.ts',
    },
    // Non-exported functions are not inspected by either phase
    {
      code: `const internalHelper = (): void => {};`,
      filename: '/project/src/adapters/fs/write-file/fs-write-file-adapter.ts',
    },
    // Outside function-exporting folders: annotated void is fine (phase 2 does not apply)
    {
      code: `export const helperContract = (): void => {};`,
      filename: '/project/src/contracts/helper/helper-contract.ts',
    },
    // Contract stub factory: annotated non-void is valid everywhere
    {
      code: `export const UserStub = ({ value }: { value: string }): { name: string } => ({ name: value });`,
      filename: '/project/src/contracts/user/user.stub.ts',
    },
    // Class export — not a function expression; phase 1 selectors don't match
    {
      code: `export class ValidationError extends Error { constructor(message: string) { super(message); } }`,
      filename: '/project/src/errors/validation/validation-error.ts',
    },
    // Code examples inside comments should not trigger
    {
      code: `// Example: export const foo = () => "bar"\nexport const good = (): string => "bar";`,
      filename: '/project/src/transformers/format/format-transformer.ts',
    },
    // Phase 5 — loose-return carve-outs

    // Adapter returning unknown at the I/O boundary — exempt by file suffix
    {
      code: `export const fsReadFileAdapter = (): unknown => null;`,
      filename: '/project/src/adapters/fs/read-file/fs-read-file-adapter.ts',
    },
    // Adapter returning object — exempt by file suffix
    {
      code: `export const fsReadFileAdapter = (): object => ({});`,
      filename: '/project/src/adapters/fs/read-file/fs-read-file-adapter.ts',
    },
    // Adapter returning Record<string, unknown> — exempt by file suffix
    {
      code: `export const fsReadFileAdapter = (): Record<string, unknown> => ({});`,
      filename: '/project/src/adapters/fs/read-file/fs-read-file-adapter.ts',
    },
    // Contract file returning unknown — exempt by file suffix (also outside function-exporting folders)
    {
      code: `export const userContract = (): unknown => null;`,
      filename: '/project/src/contracts/user/user-contract.ts',
    },
    // Proxy file returning readonly unknown[] — minimum generalization for proxy capture getters
    {
      code: `export const fooBrokerProxy = (): { getCalls: () => readonly unknown[] } => ({ getCalls: () => [] });`,
      filename: '/project/src/brokers/foo/foo-broker.proxy.ts',
    },
    // Proxy file with arrow getter returning readonly unknown[] — direct exported function
    {
      code: `export const getSpawnedArgs = (): readonly unknown[] => [];`,
      filename: '/project/src/brokers/foo/foo-broker.proxy.ts',
    },
    // Branded Record (specific finite key union, not string/PropertyKey) — not flagged
    {
      code: `export const formatTransformer = (): Record<'a' | 'b', string> => ({ a: '', b: '' });`,
      filename: '/project/src/transformers/format/format-transformer.ts',
    },
  ],
  invalid: [
    // Phase 1 — missingReturnType — applies to any exported function anywhere
    {
      code: 'export const foo = () => "bar"',
      filename: '/project/src/contracts/user/user-contract.ts',
      errors: [{ messageId: 'missingReturnType' }],
    },
    {
      code: 'export function foo() { return "bar"; }',
      filename: '/project/src/transformers/format/format-transformer.ts',
      errors: [{ messageId: 'missingReturnType' }],
    },
    {
      code: 'export default function foo() { return "bar"; }',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'missingReturnType' }],
    },
    {
      code: 'export default () => "bar"',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'missingReturnType' }],
    },
    {
      code: 'export const foo = async () => "bar"',
      filename: '/project/src/adapters/fs/read-file/fs-read-file-adapter.ts',
      errors: [{ messageId: 'missingReturnType' }],
    },
    // Phase 2 — void rejection per folder
    {
      code: `export const writeFileAdapter = (): void => {};`,
      filename: '/project/src/adapters/fs/write-file/fs-write-file-adapter.ts',
      errors: [{ messageId: 'folderVoidReturn' }],
    },
    {
      code: `export const useGuildsBinding = (): void => {};`,
      filename: '/project/src/bindings/use-guilds/use-guilds-binding.ts',
      errors: [{ messageId: 'folderVoidReturn' }],
    },
    {
      code: `export const fetchUserBroker = (): void => {};`,
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'folderVoidReturn' }],
    },
    {
      code: `export const CliFlow = (): void => {};`,
      filename: '/project/src/flows/cli/cli-flow.ts',
      errors: [{ messageId: 'folderVoidReturn' }],
    },
    {
      code: `export const authMiddleware = (): void => {};`,
      filename: '/project/src/middleware/auth/auth-middleware.ts',
      errors: [{ messageId: 'folderVoidReturn' }],
    },
    {
      code: `export const HandleResponder = (): void => {};`,
      filename: '/project/src/responders/chat/start/chat-start-responder.ts',
      errors: [{ messageId: 'folderVoidReturn' }],
    },
    {
      code: `export const sessionsState = (): void => {};`,
      filename: '/project/src/state/sessions/sessions-state.ts',
      errors: [{ messageId: 'folderVoidReturn' }],
    },
    {
      code: `export const formatTransformer = (): void => {};`,
      filename: '/project/src/transformers/format/format-transformer.ts',
      errors: [{ messageId: 'folderVoidReturn' }],
    },
    {
      code: `export const PixelBtnWidget = (): void => {};`,
      filename: '/project/src/widgets/pixel-btn/pixel-btn-widget.tsx',
      errors: [{ messageId: 'folderVoidReturn' }],
    },
    {
      code: `export const StartServer = (): void => {};`,
      filename: '/project/src/startup/start-server.ts',
      errors: [{ messageId: 'folderVoidReturn' }],
    },
    // Phase 3 — Promise<void> rejection per folder
    {
      code: `export const writeFileAdapter = (): Promise<void> => Promise.resolve();`,
      filename: '/project/src/adapters/fs/write-file/fs-write-file-adapter.ts',
      errors: [{ messageId: 'folderPromiseVoidReturn' }],
    },
    {
      code: `export const fetchUserBroker = (): Promise<void> => Promise.resolve();`,
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'folderPromiseVoidReturn' }],
    },
    {
      code: `export const HandleResponder = (): Promise<void> => Promise.resolve();`,
      filename: '/project/src/responders/chat/start/chat-start-responder.ts',
      errors: [{ messageId: 'folderPromiseVoidReturn' }],
    },
    {
      code: `export const StartServer = (): Promise<void> => Promise.resolve();`,
      filename: '/project/src/startup/start-server.ts',
      errors: [{ messageId: 'folderPromiseVoidReturn' }],
    },
    // Phase 4 — guards-specific checks
    {
      code: `export const isValidGuard = (): void => {};`,
      filename: '/project/src/guards/is-valid/is-valid-guard.ts',
      errors: [{ messageId: 'folderVoidReturn' }],
    },
    {
      code: `export const isValidGuard = (): string => 'yes';`,
      filename: '/project/src/guards/is-valid/is-valid-guard.ts',
      errors: [{ messageId: 'guardMustReturnBoolean' }],
    },
    {
      code: `export const isValidGuard = (): Promise<boolean> => Promise.resolve(true);`,
      filename: '/project/src/guards/is-valid/is-valid-guard.ts',
      errors: [{ messageId: 'guardMustReturnBoolean' }],
    },
    {
      code: `export const isValidGuard = (): number => 1;`,
      filename: '/project/src/guards/is-valid/is-valid-guard.ts',
      errors: [{ messageId: 'guardMustReturnBoolean' }],
    },
    // Multiple violations in one file
    {
      code: `
        export const fooBroker = () => "bar";
        export function bazBroker() { return 42; }
      `,
      filename: '/project/src/brokers/foo/foo-broker.ts',
      errors: [{ messageId: 'missingReturnType' }, { messageId: 'missingReturnType' }],
    },
    // Phase 5 — loose-return rejections in non-IO-boundary files
    {
      code: `export const fooBroker = (): unknown => null;`,
      filename: '/project/src/brokers/foo/foo-broker.ts',
      errors: [{ messageId: 'folderUnknownReturn' }],
    },
    {
      code: `export const fooBroker = (): object => ({});`,
      filename: '/project/src/brokers/foo/foo-broker.ts',
      errors: [{ messageId: 'folderObjectReturn' }],
    },
    {
      code: `export const fooBroker = (): Record<string, unknown> => ({});`,
      filename: '/project/src/brokers/foo/foo-broker.ts',
      errors: [{ messageId: 'folderRecordUnknownReturn' }],
    },
    {
      code: `export const fooBroker = (): Record<PropertyKey, unknown> => ({});`,
      filename: '/project/src/brokers/foo/foo-broker.ts',
      errors: [{ messageId: 'folderRecordUnknownReturn' }],
    },
    // Loose returns are also rejected in proxy files for non-readonly-unknown-array shapes
    {
      code: `export const getSpawnedArgs = (): unknown => null;`,
      filename: '/project/src/brokers/foo/foo-broker.proxy.ts',
      errors: [{ messageId: 'folderUnknownReturn' }],
    },
  ],
});
