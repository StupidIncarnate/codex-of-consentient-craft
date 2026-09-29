/**
 * PURPOSE: Reports a `-contract.ts` file that no production code parses, directly or through a
 * contract that is itself parsed. A contract nothing parses validates nothing, so its brand is
 * a claim no boundary checks. Reach for this over `enforce-contract-usage-in-tests`, which grades
 * test files; this one grades the contracts themselves against the whole repo's production code.
 *
 * Reads every workspace package once per process, so it runs in ward's lint pass only and is
 * registered `off` in the editor-facing config.
 *
 * USAGE:
 * const rule = ruleRequireContractParseBroker();
 * // Returns ESLint rule that reports `contractNeverParsed` on an unparsed contract file
 */
import { contractIndexBuildBroker } from '@dungeonmaster/shared/brokers';
import { repoRootFromSourcePathTransformer } from '@dungeonmaster/shared/transformers';

import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isFileInFolderTypeGuard } from '../../../guards/is-file-in-folder-type/is-file-in-folder-type-guard';

export const ruleRequireContractParseBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Require every contract to be parsed by production code, directly or through a parsed contract that nests it',
      },
      messages: {
        contractNeverParsed:
          'Contract {{contractNames}} is never parsed by production code. Parse it at the boundary that receives the value, or delete it.',
      },
      schema: [],
    },
  }),
  create: (context: TSESLint.RuleContext<string, unknown[]>) => ({
    'Program:exit': (node: TSESTree.Program): void => {
      const { filename } = context;
      if (
        !filename ||
        !isFileInFolderTypeGuard({ filename, folderType: 'contracts', suffix: 'contract' })
      ) {
        return;
      }

      const rootDir = repoRootFromSourcePathTransformer({ filePath: filename });
      if (rootDir === undefined) {
        return;
      }

      const entry = contractIndexBuildBroker({ rootDir }).find(
        (candidate) => candidate.filePath === filename,
      );
      if (entry === undefined || entry.isParsed) {
        return;
      }

      context.report({
        node,
        messageId: 'contractNeverParsed',
        data: { contractNames: entry.exportedContractNames.join(', ') },
      });
    },
  }),
});
