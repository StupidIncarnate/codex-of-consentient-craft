import { ruleBanTypeAliasesBroker } from './rule-ban-type-aliases-broker';
import { ruleTesterHarness } from '../../../../test/harnesses/rule-tester/rule-tester.harness';

const ruleTester = ruleTesterHarness();

ruleTester.run('ban-type-aliases', ruleBanTypeAliasesBroker(), {
  valid: [
    // A contract names its own type through z.infer / z.input / z.output
    {
      code: `
        import { z } from '#gateway/npm/zod';
        export const questContract = z.object({ id: z.string() });
        export type Quest = z.infer<typeof questContract>;
        export type QuestInput = z.input<typeof questContract>;
        export type QuestOutput = z.output<typeof questContract>;
      `,
      filename: '/project/src/contracts/quest/quest-contract.ts',
    },

    // The indexed type written where it is used
    {
      code: `export const idBroker = ({ questId }: { questId: Quest['id'] }): Quest['id'] => questId;`,
      filename: '/project/src/brokers/quest/id/quest-id-broker.ts',
    },

    // A generic alias indexes a type computed from its parameters: a compile-time type
    {
      code: `export type TransitionSpecFor<T> = TransitionMap<T>[keyof T];`,
      filename: '/project/src/contracts/transition-spec/transition-spec-contract.ts',
    },

    // An indexed alias that is not exported stays local
    {
      code: `type LocalId = Quest['id'];`,
      filename: '/project/src/brokers/quest/id/quest-id-broker.ts',
    },

    // A local alias of a library type is not exported, so it names nothing another file can learn
    {
      code: `
        import type { RuleContext } from '#gateway/npm/typescript-eslint__utils';
        type Local = RuleContext;
      `,
      filename: '/project/src/brokers/rule/x/rule-x-broker.ts',
    },

    // An alias of one of our own types, of a relative import, and of a workspace package
    {
      code: `
        import type { Quest } from '../../contracts/quest/quest-contract';
        export type Alias = Quest;
      `,
      filename: '/project/src/brokers/quest/id/quest-id-broker.ts',
    },
    {
      code: `
        import type { ProcessId } from '@dungeonmaster/shared/contracts';
        export type Alias = ProcessId;
      `,
      filename: '/project/src/contracts/process-id/process-id-contract.ts',
    },

    // Global utility types and shapes with no library name in them
    {
      code: `export type Handle = ReturnType<typeof spawnDetached>;`,
      filename: '/project/src/brokers/x/x-broker.ts',
    },
    {
      code: `export type Wide = Quest['id'] | undefined;`,
      filename: '/project/src/brokers/x/x-broker.ts',
    },
    {
      code: `export type Fn = (name: string) => void;`,
      filename: '/project/src/brokers/x/x-broker.ts',
    },

    // The gateway wraps a library's types, so it is skipped
    {
      code: `
        import type { Stats } from 'node:fs';
        export type FileStats = Stats;
        export type Field = Owner['field'];
      `,
      filename: '/project/packages/@gateway/node/src/fs/fs.ts',
    },

    // A type-only export list is not an alias
    {
      code: `
        import type { Stats } from '#gateway/node/fs';
        export type { Stats };
      `,
      filename: '/project/src/brokers/x/x-broker.ts',
    },
  ],
  invalid: [
    // B5: an exported alias of a field's type
    {
      code: `export type QuestId = Quest['id'];`,
      filename: '/project/src/contracts/quest/quest-contract.ts',
      errors: [{ messageId: 'noFieldTypeAlias', data: { name: 'QuestId' } }],
    },
    {
      code: `export type CliSignalAction = CliSignal['action'];`,
      filename: '/project/src/contracts/cli-signal/cli-signal-contract.ts',
      errors: [{ messageId: 'noFieldTypeAlias', data: { name: 'CliSignalAction' } }],
    },
    {
      code: `export type OpFilterNestedOp = OpFilter['ops'][number];`,
      filename: '/project/src/contracts/op-filter/op-filter-contract.ts',
      errors: [{ messageId: 'noFieldTypeAlias', data: { name: 'OpFilterNestedOp' } }],
    },
    {
      code: `export type StepId = Step['id'];`,
      filename: '/project/src/brokers/step/run/step-run-broker.test.ts',
      errors: [{ messageId: 'noFieldTypeAlias', data: { name: 'StepId' } }],
    },

    // C2: an exported alias that gives a library type a second name
    {
      code: `
        import type { TSESLint } from '#gateway/npm/typescript-eslint__utils';
        export type EslintContext = TSESLint.RuleContext<string, []>;
      `,
      filename: '/project/src/contracts/eslint-context/eslint-context-contract.ts',
      errors: [
        { messageId: 'noLibraryTypeAlias', data: { name: 'EslintContext', library: 'TSESLint' } },
      ],
    },
    {
      code: `
        import type { Stats } from '#gateway/node/fs';
        export type FileStats = Stats;
      `,
      filename: '/project/src/brokers/fs/stat/fs-stat-broker.ts',
      errors: [{ messageId: 'noLibraryTypeAlias', data: { name: 'FileStats', library: 'Stats' } }],
    },
    {
      code: `
        import { z } from '#gateway/npm/zod';
        export type AnyZodSchema = z.ZodType;
      `,
      filename: '/project/src/contracts/ingredient-config/ingredient-config-contract.ts',
      errors: [{ messageId: 'noLibraryTypeAlias', data: { name: 'AnyZodSchema', library: 'z' } }],
    },
    {
      code: `
        import type { Page } from 'playwright';
        export type BrowserPage<T> = Page<T>;
      `,
      filename: '/project/src/brokers/x/x-broker.ts',
      errors: [{ messageId: 'noLibraryTypeAlias', data: { name: 'BrowserPage', library: 'Page' } }],
    },
    {
      code: `
        import * as Pw from 'playwright';
        export type BrowserPage = Pw.Page;
      `,
      filename: '/project/src/brokers/x/x-broker.ts',
      errors: [{ messageId: 'noLibraryTypeAlias', data: { name: 'BrowserPage', library: 'Pw' } }],
    },
    {
      code: `
        import type { Stats } from 'node:fs';
        export type FileStats = Stats;
      `,
      filename: '/project/src/brokers/x/x-broker.proxy.ts',
      errors: [{ messageId: 'noLibraryTypeAlias', data: { name: 'FileStats', library: 'Stats' } }],
    },
  ],
});
