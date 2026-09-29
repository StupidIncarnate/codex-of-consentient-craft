/**
 * PURPOSE: Refuses a stub or a proxy reaching a file that is not test support: an import of a `.stub` or `.proxy` specifier, an import or re-export of a name ending `Stub` or `Proxy` from a workspace or relative module, and a `export ... from` of either. Covers a production barrel that re-exports one, since a barrel is a production file. Test, proxy, stub and harness files and anything under `test/` may import them freely; a stub that re-exports its own layers is a stub file, so it stays allowed. Reads no file, so it runs pre-edit.
 *
 * USAGE:
 * const rule = ruleBanTestSupportInProductionBroker();
 * // Flags `import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub'` in a broker,
 * // and `export * from './quest.stub'` in `src/contracts/contracts.ts`
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isTestSupportFileGuard } from '../../../guards/is-test-support-file/is-test-support-file-guard';
import { reportTestSupportLayerBroker } from './report-test-support-layer-broker';

export const ruleBanTestSupportInProductionBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban importing or re-exporting a stub or proxy from a file that is not test support.',
      },
      messages: {
        testSupportInProduction:
          '"{{what}}" is test support and {{verb}} in a production file. Build the value from the contract or statics instead; only a test, proxy, stub or harness file imports a stub or proxy, each from its own file.',
      },
      schema: [],
    },
  }),
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const { filename } = ctx;

    if (isTestSupportFileGuard({ filename })) {
      return {};
    }

    return {
      ImportDeclaration: (node: TSESTree.ImportDeclaration): void => {
        reportTestSupportLayerBroker({ node, context: ctx, verb: 'imported' });
      },
      ExportNamedDeclaration: (node: TSESTree.ExportNamedDeclaration): void => {
        reportTestSupportLayerBroker({ node, context: ctx, verb: 'exported' });
      },
      ExportAllDeclaration: (node: TSESTree.ExportAllDeclaration): void => {
        reportTestSupportLayerBroker({ node, context: ctx, verb: 'exported' });
      },
    };
  },
});
