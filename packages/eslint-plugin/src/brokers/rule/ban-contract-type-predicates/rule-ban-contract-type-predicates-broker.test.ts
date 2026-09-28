import { ruleTesterHarness } from '../../../../test/harnesses/rule-tester/rule-tester.harness';
import { ruleBanContractTypePredicatesBroker } from './rule-ban-contract-type-predicates-broker';

const ruleTester = ruleTesterHarness();

const GUARD_FILE =
  '/project/src/guards/is-dungeonmaster-hooks-config/is-dungeonmaster-hooks-config-guard.ts';

ruleTester.run('ban-contract-type-predicates', ruleBanContractTypePredicatesBroker(), {
  valid: [
    // --- narrows a library's own type, reached through a qualified name — ordinary discriminated
    // union narrowing, exactly what predicates are for ---
    {
      code: `
        import type { TSESTree } from '@typescript-eslint/utils';
        export const isCallExpression = (node: TSESTree.Node): node is TSESTree.CallExpression =>
          node.type === 'CallExpression';
      `,
      filename: GUARD_FILE,
    },

    // --- narrows a type imported from an npm package directly ---
    {
      code: `
        import type { SomeLibType } from 'some-lib';
        export const isSomeLibType = (value: unknown): value is SomeLibType =>
          typeof value === 'object';
      `,
      filename: GUARD_FILE,
    },

    // --- narrows a relative import that is NOT under a contracts/ folder — our own type, but not
    // one of the two refused forms ---
    {
      code: `
        import type { LocalHandle } from './local-handle';
        export const isLocalHandle = (value: unknown): value is LocalHandle =>
          typeof value === 'object';
      `,
      filename: GUARD_FILE,
    },

    // --- a language global, never imported — unresolved import lookup ---
    {
      code: `
        export const isError = (value: unknown): value is Error => value instanceof Error;
      `,
      filename: GUARD_FILE,
    },

    // --- returns a plain boolean, no predicate at all — never visited ---
    {
      code: `
        export const hasError = ({ error }: { error: unknown }): boolean => error !== undefined;
      `,
      filename: GUARD_FILE,
    },

    // --- an `asserts value` signature with no `is X` — no target type to judge ---
    {
      code: `
        export const assertIsDefined = (value: unknown): asserts value => {
          if (value === undefined) throw new Error('required');
        };
      `,
      filename: GUARD_FILE,
    },

    // --- the import source contains "contracts" as a substring, but not as its own path segment
    // — the regex boundary must not false-positive on this ---
    {
      code: `
        import type { Foo } from './my-contracts-thing';
        export const isFoo = (value: unknown): value is Foo => typeof value === 'object';
      `,
      filename: GUARD_FILE,
    },
  ],

  invalid: [
    // --- narrows a type imported from a relative contracts/ path — the item's own named case ---
    {
      code: `
        import type { DungeonmasterHooksConfig } from '../../../contracts/dungeonmaster-hooks-config/dungeonmaster-hooks-config-contract';
        export const isDungeonmasterHooksConfig = (value: unknown): value is DungeonmasterHooksConfig =>
          typeof value === 'object';
      `,
      filename: GUARD_FILE,
      errors: [
        {
          messageId: 'contractTypePredicate',
          data: {
            typeName: 'DungeonmasterHooksConfig',
            importSource:
              '../../../contracts/dungeonmaster-hooks-config/dungeonmaster-hooks-config-contract',
          },
        },
      ],
    },

    // --- narrows a type imported from a workspace package's contracts export ---
    {
      code: `
        import type { WorkItem } from '@dungeonmaster/shared/contracts';
        export const isWorkItem = (value: unknown): value is WorkItem =>
          typeof value === 'object';
      `,
      filename: GUARD_FILE,
      errors: [
        {
          messageId: 'contractTypePredicate',
          data: { typeName: 'WorkItem', importSource: '@dungeonmaster/shared/contracts' },
        },
      ],
    },

    // --- a qualified type name rooted at a contracts-imported namespace — proves the root-walk
    // resolves the whole chain off the LEFTMOST identifier's import ---
    {
      code: `
        import type * as Contracts from '@dungeonmaster/shared/contracts';
        export const isQuest = (value: unknown): value is Contracts.Quest =>
          typeof value === 'object';
      `,
      filename: GUARD_FILE,
      errors: [
        {
          messageId: 'contractTypePredicate',
          data: { typeName: 'Contracts.Quest', importSource: '@dungeonmaster/shared/contracts' },
        },
      ],
    },

    // --- an indexed type off an imported contract type — the item's own named case ---
    {
      code: `
        import type { Quest } from '../../../contracts/quest/quest-contract';
        export const isQuestId = (value: unknown): value is Quest['id'] =>
          typeof value === 'string';
      `,
      filename: GUARD_FILE,
      errors: [{ messageId: 'indexedTypePredicate', data: { typeName: "Quest['id']" } }],
    },

    // --- an indexed type with NO import for the object type at all — flagged regardless, since
    // indexing itself is the refused shape, not the import source ---
    {
      code: `
        export const isField = (value: unknown): value is SomeType['field'] =>
          typeof value === 'string';
      `,
      filename: GUARD_FILE,
      errors: [{ messageId: 'indexedTypePredicate', data: { typeName: "SomeType['field']" } }],
    },
  ],
});
