import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleEnforceGatewaySchemaFieldsBroker } from './rule-enforce-gateway-schema-fields-broker';

const ruleTester = eslintRuleTesterAdapter();

const CONTRACT_FILE = '/project/src/contracts/work-item/work-item-contract.ts';
const NESTED_CONTRACT_FILE = '/project/src/contracts/scan/scan-contract.ts';
const NON_CONTRACT_FILE = '/project/src/brokers/work-item/fetch/work-item-fetch-broker.ts';

ruleTester.run('enforce-gateway-schema-fields', ruleEnforceGatewaySchemaFieldsBroker(), {
  valid: [
    // --- the gateway's own schema imported and used directly as the field value ---
    {
      code: `
        import { childProcessSchema } from '#gateway/node/child_process';
        export const workItemContract = z.object({ id: z.string(), proc: childProcessSchema });
      `,
      filename: CONTRACT_FILE,
    },

    // --- an array of the gateway's own schema — still just an Identifier, not a CallExpression ---
    {
      code: `
        import { walkedFileSchema } from '#gateway/node/fs';
        export const scanContract = z.object({ files: z.array(walkedFileSchema).default([]) });
      `,
      filename: CONTRACT_FILE,
    },

    // --- nested z.object(), imported schema at the inner field ---
    {
      code: `
        import { childProcessSchema } from '#gateway/node/child_process';
        export const scanContract = z.object({
          child: z.object({ proc: childProcessSchema }),
        });
      `,
      filename: NESTED_CONTRACT_FILE,
    },

    // --- z.custom used, but never as a z.object(...) field — out of this rule's scope ---
    {
      code: `
        import { ChildProcess } from 'child_process';
        export const looseSchema = z.custom<ChildProcess>();
      `,
      filename: CONTRACT_FILE,
    },

    // --- z.instanceof inside z.object(), but the file is not a *-contract.ts under contracts/ ---
    {
      code: `
        import { ChildProcess } from 'child_process';
        export const c = z.object({ proc: z.instanceof(ChildProcess) });
      `,
      filename: NON_CONTRACT_FILE,
    },

    // --- a language global (never imported) — not what BR C9 is about ---
    {
      code: 'export const c = z.object({ errorField: z.instanceof(Error) });',
      filename: CONTRACT_FILE,
    },

    // --- a relative import — our own type, not an outside package's ---
    {
      code: `
        import type { LocalHandle } from './local-handle';
        export const c = z.object({ handle: z.custom<LocalHandle>((v) => typeof v === 'object') });
      `,
      filename: CONTRACT_FILE,
    },

    // --- a workspace package import (@dungeonmaster/*) — also our own, not an outside package's ---
    {
      code: `
        import type { WorkItem } from '@dungeonmaster/shared/contracts';
        export const c = z.object({ item: z.custom<WorkItem>((v) => typeof v === 'object') });
      `,
      filename: CONTRACT_FILE,
    },
  ],

  invalid: [
    // --- bare z.custom<T>(), a Node builtin type (the item's own "Done when" mutation case) ---
    {
      code: `
        import { ChildProcess } from 'child_process';
        export const workItemContract = z.object({ proc: z.custom<ChildProcess>() });
      `,
      filename: CONTRACT_FILE,
      errors: [
        {
          messageId: 'directZodEscapeHatch',
          data: { key: 'proc', typeName: 'ChildProcess', importSource: 'child_process' },
        },
      ],
    },

    // --- bare z.instanceof(...), a Node builtin type ---
    {
      code: `
        import { ChildProcess } from 'child_process';
        export const workItemContract = z.object({ proc: z.instanceof(ChildProcess) });
      `,
      filename: CONTRACT_FILE,
      errors: [
        {
          messageId: 'directZodEscapeHatch',
          data: { key: 'proc', typeName: 'ChildProcess', importSource: 'child_process' },
        },
      ],
    },

    // --- z.custom with a check function AND a brand, an npm-package type — still a hand-copy of
    // the gateway's check ---
    {
      code: `
        import type { WalkedFile } from 'graceful-fs';
        export const scanContract = z.object({
          walked: z.custom<WalkedFile>(isWalkedFile).brand<'#GatewayWalkedFile'>(),
        });
      `,
      filename: NESTED_CONTRACT_FILE,
      errors: [
        {
          messageId: 'directZodEscapeHatch',
          data: { key: 'walked', typeName: 'WalkedFile', importSource: 'graceful-fs' },
        },
      ],
    },

    // --- nested z.object(), the inner field is the offender ---
    {
      code: `
        import { ChildProcess } from 'child_process';
        export const scanContract = z.object({
          child: z.object({ proc: z.custom<ChildProcess>() }),
        });
      `,
      filename: NESTED_CONTRACT_FILE,
      errors: [
        {
          messageId: 'directZodEscapeHatch',
          data: { key: 'proc', typeName: 'ChildProcess', importSource: 'child_process' },
        },
      ],
    },

    // --- string-literal property key ---
    {
      code: `
        import { ChildProcess } from 'child_process';
        export const workItemContract = z.object({ 'proc': z.instanceof(ChildProcess) });
      `,
      filename: CONTRACT_FILE,
      errors: [
        {
          messageId: 'directZodEscapeHatch',
          data: { key: 'proc', typeName: 'ChildProcess', importSource: 'child_process' },
        },
      ],
    },
  ],
});
