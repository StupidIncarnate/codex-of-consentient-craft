import { typedRuleTesterHarness } from '../../../../test/harnesses/typed-rule-tester/typed-rule-tester.harness';
import { ruleEnforceFolderReturnTypesBroker } from './rule-enforce-folder-return-types-broker';

// Real files on disk, so `parserOptions.project: true` resolves each one to its own package's real
// tsconfig.json by walking the real directory tree — see packages/eslint-plugin/CLAUDE.md: only the
// FILENAME need be real, not its contents (RuleTester substitutes each case's own `code`). A
// discarded call's callee resolves through the SAME mechanism, so a call to a locally-declared
// `const` inside BROKER_FILE resolves back to that same real `/brokers/…-broker.ts` path — which is
// how the "discards a broker call" cases below are built without a second real anchor file, and why
// they use a same-file local rather than a real cross-package `#gateway/*` import: an anchor file
// outside its own package's dependency graph can leave that import unresolved under a real
// typed program, silently widening the call's type to `any` — false-negative for R1, not caught by
// RuleTester's own error list.
const DIR_SEGMENTS = __dirname.split('/');
// .../packages/eslint-plugin/src/brokers/rule/enforce-folder-return-types — 6 up is the repo root
const REPO_ROOT = DIR_SEGMENTS.slice(0, -6).join('/');
const BROKER_FILE = `${DIR_SEGMENTS.join('/')}/rule-enforce-folder-return-types-broker.ts`;
const BROKER_PROXY_FILE = `${DIR_SEGMENTS.join('/')}/check-folder-return-type-layer-broker.proxy.ts`;
const ADAPTER_FILE = `${REPO_ROOT}/packages/hydration-recipes/src/adapters/dm-jsonl/append/dm-jsonl-append-adapter.ts`;
const GUARD_FILE = `${REPO_ROOT}/packages/eslint-plugin/src/guards/is-gateway-file/is-gateway-file-guard.ts`;
const RESPONDER_FILE = `${REPO_ROOT}/packages/eslint-plugin/src/responders/eslint-plugin/create/eslint-plugin-create-responder.ts`;
const FLOW_FILE = `${REPO_ROOT}/packages/eslint-plugin/src/flows/eslint-plugin/eslint-plugin-flow.ts`;
const CONTRACT_FILE = `${REPO_ROOT}/packages/eslint-plugin/src/contracts/eslint-rule/eslint-rule-contract.ts`;
const TRANSFORMER_FILE = `${REPO_ROOT}/packages/eslint-plugin/src/transformers/function-exporting-folder-from-filename/function-exporting-folder-from-filename-transformer.ts`;

const ruleTester = typedRuleTesterHarness();

ruleTester.run('enforce-folder-return-types', ruleEnforceFolderReturnTypesBroker(), {
  valid: [
    // missingReturnType does not apply once a return type is present
    {
      code: `export const fetchDataAdapter = (): Promise<string> => Promise.resolve('data');`,
      filename: ADAPTER_FILE,
    },
    {
      code: `export const HandleResponder = (): Promise<{ data: number }> => Promise.resolve({ data: 1 });`,
      filename: RESPONDER_FILE,
    },
    {
      code: `export const CliFlow = (): Promise<number> => Promise.resolve(0);`,
      filename: FLOW_FILE,
    },
    {
      code: `export const isValidGuard = (): boolean => true;`,
      filename: GUARD_FILE,
    },
    // Contract returning unknown — outside function-exporting folders, and exempt by suffix too
    {
      code: `export const userContract = (): unknown => null;`,
      filename: CONTRACT_FILE,
    },

    // R1 — void is legitimate when calls said nothing
    {
      code: `export const emptyBroker = (): void => {};`,
      filename: BROKER_FILE,
    },
    // The discarded call is declared in this SAME file, so its own declaration resolves back to
    // BROKER_FILE — a real `/brokers/…-broker.ts` path — without needing a second anchor.
    {
      code: `
        const doNothingBroker = (): void => {};
        export const noopBroker = (): void => {
          doNothingBroker();
        };
      `,
      filename: BROKER_FILE,
    },
    {
      code: `
        const doNothingAsyncBroker = async (): Promise<void> => {};
        export const cleanupBroker = async (): Promise<void> => {
          await doNothingAsyncBroker();
        };
      `,
      filename: BROKER_FILE,
    },
    {
      code: `
        const doNothingBroker = (): void => {};
        export const legacyBroker = (): { success: true } => {
          doNothingBroker();
          return { success: true };
        };
      `,
      filename: BROKER_FILE,
    },
    // A discarded call to array.push is a MemberExpression callee, never a candidate
    {
      code: `
        export const noopBroker = (): void => {
          const items: number[] = [];
          items.push(1);
        };
      `,
      filename: BROKER_FILE,
    },
  ],
  invalid: [
    // Phase 1 — missingReturnType — applies to any exported function anywhere
    {
      code: 'export const foo = () => "bar"',
      filename: CONTRACT_FILE,
      errors: [{ messageId: 'missingReturnType' }],
    },
    {
      code: 'export function foo() { return "bar"; }',
      filename: TRANSFORMER_FILE,
      errors: [{ messageId: 'missingReturnType' }],
    },
    // Multiple violations in one file
    {
      code: `
        export const fooBroker = () => "bar";
        export function bazBroker() { return 42; }
      `,
      filename: BROKER_FILE,
      errors: [{ messageId: 'missingReturnType' }, { messageId: 'missingReturnType' }],
    },

    // R1 — void discarding a real value
    {
      code: `
        const otherBroker = (): boolean => true;
        export const fooBroker = (): void => {
          otherBroker();
        };
      `,
      filename: BROKER_FILE,
      errors: [{ messageId: 'folderVoidReturn' }],
    },
    {
      code: `
        const realFactBroker = async (): Promise<boolean> => true;
        export const cleanupBroker = async (): Promise<void> => {
          await realFactBroker();
        };
      `,
      filename: BROKER_FILE,
      errors: [{ messageId: 'folderPromiseVoidReturn' }],
    },
    {
      code: `
        const otherBroker = (): boolean => true;
        export const legacyBroker = (): { success: true } => {
          otherBroker();
          return { success: true };
        };
      `,
      filename: BROKER_FILE,
      errors: [{ messageId: 'folderDisguisedVoidReturn' }],
    },

    // Phase 4 — guards-specific checks
    {
      code: `export const isValidGuard = (): void => {};`,
      filename: GUARD_FILE,
      errors: [{ messageId: 'guardMustReturnBoolean' }],
    },
    {
      code: `export const isValidGuard = (): string => 'yes';`,
      filename: GUARD_FILE,
      errors: [{ messageId: 'guardMustReturnBoolean' }],
    },
    {
      code: `export const isValidGuard = (): Promise<boolean> => Promise.resolve(true);`,
      filename: GUARD_FILE,
      errors: [{ messageId: 'guardMustReturnBoolean' }],
    },

    // Phase 5 — loose-return rejections in non-IO-boundary files, unaffected by R1
    {
      code: `export const fooBroker = (): unknown => null;`,
      filename: BROKER_FILE,
      errors: [{ messageId: 'folderUnknownReturn' }],
    },
    {
      code: `export const fooBroker = (): object => ({});`,
      filename: BROKER_FILE,
      errors: [{ messageId: 'folderObjectReturn' }],
    },
    {
      code: `export const fooBroker = (): Record<string, unknown> => ({});`,
      filename: BROKER_FILE,
      errors: [{ messageId: 'folderRecordUnknownReturn' }],
    },
    // Loose returns are also rejected in proxy files for non-readonly-unknown-array shapes
    {
      code: `export const getSpawnedArgs = (): unknown => null;`,
      filename: BROKER_PROXY_FILE,
      errors: [{ messageId: 'folderUnknownReturn' }],
    },
  ],
});
