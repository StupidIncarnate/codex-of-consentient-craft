/**
 * PURPOSE: Reports an object contract whose name another workspace package also declares. Two
 * packages holding one name mint one brand text over two checks, and the compiler cannot tell them
 * apart. Reach for this over `require-object-contract-brands`, which grades one file's own brands;
 * this one compares a contract's name against every other package. Standalone scalar brands are not
 * compared, because the scalar migration removes them.
 *
 * Reads every workspace package once per process, so it runs in ward's lint pass only and is
 * registered `off` in the editor-facing config.
 *
 * USAGE:
 * const rule = ruleEnforceUniqueContractNamesBroker();
 * // Returns ESLint rule that reports `duplicateContractName` on a contract another package also declares
 */
import { ownerIndexBuildBroker } from '@dungeonmaster/shared/brokers';
import { repoRootFromSourcePathTransformer } from '@dungeonmaster/shared/transformers';

import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isFileInFolderTypeGuard } from '../../../guards/is-file-in-folder-type/is-file-in-folder-type-guard';

export const ruleEnforceUniqueContractNamesBroker =
  (): TSESLint.RuleModule<'duplicateContractName'> => ({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Require an object contract name to be declared by exactly one workspace package',
      },
      messages: {
        duplicateContractName:
          '{{name}} is already defined in {{otherPackage}}. A contract name is unique across the repo — import it from there, or move it to a package every user depends on.',
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

        const { owners } = ownerIndexBuildBroker({ rootDir });
        for (const owner of owners.filter((candidate) => candidate.filePath === filename)) {
          const otherPackages = [
            ...new Set(
              owners
                .filter(
                  (candidate) =>
                    candidate.contractName === owner.contractName &&
                    candidate.packageName !== owner.packageName,
                )
                .map((candidate) => String(candidate.packageName)),
            ),
          ];
          if (otherPackages.length > 0) {
            context.report({
              node,
              messageId: 'duplicateContractName',
              data: { name: owner.contractName, otherPackage: otherPackages.join(', ') },
            });
          }
        }
      },
    }),
  });
