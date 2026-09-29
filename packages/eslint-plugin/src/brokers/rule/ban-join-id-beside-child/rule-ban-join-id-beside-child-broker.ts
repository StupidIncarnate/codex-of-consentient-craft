/**
 * PURPOSE: Refuses an object contract that holds a child contract whole and also holds the child's
 * id as a second key: `{ quest: questContract, questId: questContract.shape.id }`. Nothing checks the
 * two agree, so the id key goes and callers read `quest.id`. An id key is one whose camelCase words
 * end in the child's owner name plus `id` (`parentQuestId` for `questContract`), or one that reuses
 * `<child>.shape.id` under any name; when two children match one name, the longest owner name wins.
 * A child that is optional, nullable or defaulted is a different shape and stays. No autofix:
 * removing the key breaks every caller that reads it, so a person changes those callers.
 * Reads only the file it lints, so it is pre-edit eligible.
 *
 * USAGE:
 * const rule = ruleBanJoinIdBesideChildBroker();
 * // Flags `questId` in `z.object({ quest: questContract, questId: questContract.shape.id })`
 */
import { identifierContract } from '@dungeonmaster/shared/contracts';
import type { Identifier } from '@dungeonmaster/shared/contracts';
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isFileInFolderTypeGuard } from '../../../guards/is-file-in-folder-type/is-file-in-folder-type-guard';
import { isAstObjectSchemaGuard } from '../../../guards/is-ast-object-schema/is-ast-object-schema-guard';
import { astPropertyKeyNameTransformer } from '../../../transformers/ast-property-key-name/ast-property-key-name-transformer';
import { dotCountTransformer } from '../../../transformers/dot-count/dot-count-transformer';
import { identifierCamelWordsTransformer } from '../../../transformers/identifier-camel-words/identifier-camel-words-transformer';
import { propertyChildContractTransformer } from '../../../transformers/property-child-contract/property-child-contract-transformer';
import { propertyReusedIdOwnerTransformer } from '../../../transformers/property-reused-id-owner/property-reused-id-owner-transformer';

const CONTRACT_SUFFIX = 'Contract';

export const ruleBanJoinIdBesideChildBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          "Ban an object contract that holds a child contract whole and also holds the child's id as a separate key",
      },
      messages: {
        joinIdBesideChild:
          '{{idKey}} copies {{childKey}}.id, and nothing checks that they match. Remove {{idKey}} and read {{childKey}}.id.',
      },
      schema: [],
    },
  }),
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const { filename } = ctx;
    const baseName = filename.split('/').pop() ?? '';

    if (
      !(filename.endsWith('.ts') || filename.endsWith('.tsx')) ||
      dotCountTransformer({ str: baseName }) > 1 ||
      !isFileInFolderTypeGuard({ filename, folderType: 'contracts', suffix: 'contract' })
    ) {
      return {};
    }

    return {
      CallExpression: (node: TSESTree.CallExpression): void => {
        if (!isAstObjectSchemaGuard({ node })) {
          return;
        }
        const [shape] = node.arguments;
        if (shape?.type !== AST_NODE_TYPES.ObjectExpression) {
          return;
        }

        const properties = shape.properties
          .filter((property) => property.type === AST_NODE_TYPES.Property)
          .map((property) => ({
            node: property,
            key: astPropertyKeyNameTransformer({ property }),
            text: ctx.sourceCode.getText(property),
          }));

        // A key that holds a contract whole: a bare identifier, so not optional, nullable or defaulted.
        const children: { key: Identifier; contract: Identifier; words: Identifier[] }[] = [];
        for (const { key, text } of properties) {
          const contract = propertyChildContractTransformer({ text });
          if (key !== null && contract !== null) {
            children.push({
              key,
              contract,
              words: identifierCamelWordsTransformer({
                identifier: identifierContract.parse(contract.slice(0, -CONTRACT_SUFFIX.length)),
              }),
            });
          }
        }

        for (const { node: property, key: idKey, text } of properties) {
          if (idKey === null || children.some((child) => child.key === idKey)) {
            continue;
          }

          const reusedOwner = propertyReusedIdOwnerTransformer({ text });
          const idWords = identifierCamelWordsTransformer({ identifier: idKey });
          const [byName] = children
            .filter((child) => {
              const wanted = [...child.words, 'id'];
              const tail = idWords.slice(idWords.length - wanted.length);
              return (
                idWords.length >= wanted.length && wanted.every((word, at) => word === tail[at])
              );
            })
            .sort((left, right) => right.words.length - left.words.length);
          const matched = children.find((child) => child.contract === reusedOwner) ?? byName;

          if (matched !== undefined) {
            ctx.report({
              node: property,
              messageId: 'joinIdBesideChild',
              data: { idKey, childKey: matched.key },
            });
          }
        }
      },
    };
  },
});
