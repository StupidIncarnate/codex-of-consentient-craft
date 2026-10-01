/**
 * PURPOSE: Reports a `-contract.ts` file that no production code parses, directly or through a
 * contract that is itself parsed. A contract nothing parses validates nothing, so its brand is
 * a claim no boundary checks. Reach for this over `enforce-contract-usage-in-tests`, which grades
 * test files; this one grades the contracts themselves against the whole repo's production code.
 *
 * Takes the contract index once per process, from the per-package cache shards
 * contractIndexBuildBroker keeps on disk, which still walks every workspace package and resolves
 * names across files; so it runs in ward's lint pass only and is registered `off` in the
 * editor-facing config.
 *
 * USAGE:
 * const rule = ruleRequireContractParseBroker();
 * // Returns ESLint rule that reports `contractNeverParsed` on an unparsed contract file and
 * // `typeNotSchemaInferred` on an exported type that is neither z.infer of a schema in the file nor exempt
 */
import { contractIndexBuildBroker } from '@dungeonmaster/shared/brokers';
import { repoRootFromSourcePathTransformer } from '@dungeonmaster/shared/transformers';

import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isFileInFolderTypeGuard } from '../../../guards/is-file-in-folder-type/is-file-in-folder-type-guard';

export const ruleRequireContractParseBroker = (): TSESLint.RuleModule<
  'contractNeverParsed' | 'typeNotSchemaInferred'
> => ({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require every contract to be parsed by production code, directly or through a parsed contract that nests it',
    },
    messages: {
      contractNeverParsed:
        'Contract {{contractNames}} is never parsed by production code. Parse it at the boundary that receives the value, or delete it.',
      typeNotSchemaInferred:
        "`{{typeName}}` in `{{file}}` is not z.infer of a schema in this file. A contract's exported types must come from its own parse.",
    },
    schema: [],
  },
  defaultOptions: [],
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
      if (entry === undefined) {
        return;
      }

      const fileName = filename.split('/').pop() ?? filename;
      for (const typeExport of entry.typeExports) {
        if (!typeExport.isSchemaInferred && !typeExport.isExempt) {
          context.report({
            node,
            messageId: 'typeNotSchemaInferred',
            data: { typeName: typeExport.typeName, file: fileName },
          });
        }
      }

      // A file with no const has nothing to parse; the type check above is all it is graded on.
      if (entry.isParsed || entry.exportedContractNames.length === 0) {
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
