/**
 * PURPOSE: A key of an object contract, or a function parameter, whose name says it holds another
 * owner's field (`questId`, `parentQuestId`) reuses that field: `questContract.shape.id` in a
 * contract, `Quest['id']` as a parameter type. The owner comes from the owner index, matched on
 * camelCase words with the longest owner name winning, and only among owners the file can import.
 * Reach for this over `require-object-contract-brands`, which grades a key's own brand text: a key
 * this rule claims declares no brand of its own. Reads every workspace package once per process, so
 * it runs in ward's lint pass only and is registered `off` until the brand migration is done.
 * A test, proxy, stub or harness file is not graded, since a test takes its types from stubs.
 *
 * USAGE:
 * const rule = ruleEnforceOwnerFieldReuseBroker();
 * // Reports `({ questId }: { questId: string })` and fixes it to `{ questId: Quest['id'] }`
 */
import { ownerIndexBuildBroker } from '@dungeonmaster/shared/brokers';
import {
  ownerIndexNameMatchTransformer,
  repoRootFromSourcePathTransformer,
} from '@dungeonmaster/shared/transformers';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isAstNameImportedGuard } from '../../../guards/is-ast-name-imported/is-ast-name-imported-guard';
import { isAstObjectSchemaGuard } from '../../../guards/is-ast-object-schema/is-ast-object-schema-guard';
import { isFileInFolderTypeGuard } from '../../../guards/is-file-in-folder-type/is-file-in-folder-type-guard';
import { isInTestDirGuard } from '../../../guards/is-in-test-dir/is-in-test-dir-guard';
import { astImportInsertAnchorTransformer } from '../../../transformers/ast-import-insert-anchor/ast-import-insert-anchor-transformer';
import { astOwnerTypeCandidateTransformer } from '../../../transformers/ast-owner-type-candidate/ast-owner-type-candidate-transformer';
import { astParamTypedCarriersTransformer } from '../../../transformers/ast-param-typed-carriers/ast-param-typed-carriers-transformer';
import { astPropertyKeyNameTransformer } from '../../../transformers/ast-property-key-name/ast-property-key-name-transformer';
import { dotCountTransformer } from '../../../transformers/dot-count/dot-count-transformer';
import { importInsertTextTransformer } from '../../../transformers/import-insert-text/import-insert-text-transformer';
import { objectPropertyValueTransformer } from '../../../transformers/object-property-value/object-property-value-transformer';
import { ownerIndexFilePackageTransformer } from '../../../transformers/owner-index-file-package/owner-index-file-package-transformer';
import { ownerIndexImportSourceTransformer } from '../../../transformers/owner-index-import-source/owner-index-import-source-transformer';
import { propertyReusedFieldTransformer } from '../../../transformers/property-reused-field/property-reused-field-transformer';
import { valueReuseFixTextTransformer } from '../../../transformers/value-reuse-fix-text/value-reuse-fix-text-transformer';

export const ruleEnforceOwnerFieldReuseBroker = (): TSESLint.RuleModule<
  'contractKeyNotReused' | 'paramNotOwnerType'
> => ({
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: {
      description:
        "A key or parameter named for another owner's field reuses that field: `ownerContract.shape.key` in a contract, `Owner['key']` as a parameter type",
    },
    messages: {
      contractKeyNotReused:
        "{{key}} holds {{owner}}'s {{field}}. Use {{ownerContract}}.shape.{{field}}.",
      paramNotOwnerType: "{{name}} holds {{owner}}'s {{field}}. Type it {{Owner}}['{{field}}'].",
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const { filename } = ctx;
    const baseName = filename.split('/').pop() ?? '';
    const rootDir = repoRootFromSourcePathTransformer({ filePath: filename });

    // A test, proxy, stub, harness or declaration file has more than one dot in its name.
    if (
      !(filename.endsWith('.ts') || filename.endsWith('.tsx')) ||
      dotCountTransformer({ str: baseName }) > 1 ||
      isInTestDirGuard({ filename }) ||
      rootDir === undefined
    ) {
      return {};
    }

    const isContract = isFileInFolderTypeGuard({
      filename,
      folderType: 'contracts',
      suffix: 'contract',
    });
    const programs: TSESTree.Program[] = [];

    return {
      Program: (node: TSESTree.Program): void => {
        programs.push(node);
      },

      CallExpression: (node: TSESTree.CallExpression): void => {
        const [shape] = node.arguments;
        if (
          !isContract ||
          !isAstObjectSchemaGuard({ node }) ||
          shape?.type !== AST_NODE_TYPES.ObjectExpression
        ) {
          return;
        }

        const ownerIndex = ownerIndexBuildBroker({ rootDir });
        const packageName = ownerIndexFilePackageTransformer({ ownerIndex, filePath: filename });
        if (packageName === undefined) {
          return;
        }

        for (const property of shape.properties) {
          const key =
            property.type === AST_NODE_TYPES.Property
              ? astPropertyKeyNameTransformer({ property })
              : null;
          const match =
            key === null
              ? undefined
              : ownerIndexNameMatchTransformer({ ownerIndex, packageName, name: key });
          if (key === null || match === undefined) {
            continue;
          }

          const { owner, field } = match;
          const reuse = `${owner.contractName}.shape.${field.key}`;
          const propertyText = ctx.sourceCode.getText(property);
          if (propertyReusedFieldTransformer({ text: propertyText }) === reuse) {
            continue;
          }

          const value = objectPropertyValueTransformer({ properties: [property], name: key });
          const fixText =
            value === undefined ||
            (property.type === AST_NODE_TYPES.Property && property.shorthand) ||
            propertyText.startsWith('get ')
              ? null
              : valueReuseFixTextTransformer({
                  valueText: ctx.sourceCode.getText(value),
                  reuse,
                });

          ctx.report({
            node: property,
            messageId: 'contractKeyNotReused',
            data: {
              key,
              owner: owner.ownerName,
              field: field.key,
              ownerContract: owner.contractName,
            },
            fix: (fixer) => {
              const [program] = programs;
              if (value === undefined || fixText === null || program === undefined) {
                return null;
              }
              // The owner's own file has no import to write: a key there reads a local const.
              if (owner.filePath === filename) {
                return null;
              }

              const replacement = fixer.replaceText(value, fixText);
              if (isAstNameImportedGuard({ program, name: owner.contractName })) {
                return replacement;
              }

              const source = ownerIndexImportSourceTransformer({
                ownerFilePath: owner.filePath,
                ownerPackageName: owner.packageName,
                filePath: filename,
                packageName,
              });
              const anchor = astImportInsertAnchorTransformer({
                program,
                source,
                importKind: 'value',
              });
              const text = importInsertTextTransformer({
                anchor,
                name: owner.contractName,
                source,
                importKind: 'value',
              });
              const [first] = program.body;
              if (anchor === null) {
                return first === undefined
                  ? replacement
                  : [replacement, fixer.insertTextBefore(first, text)];
              }
              return [replacement, fixer.insertTextAfter(anchor, text)];
            },
          });
        }
      },

      'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression': (
        node:
          | TSESTree.FunctionDeclaration
          | TSESTree.FunctionExpression
          | TSESTree.ArrowFunctionExpression,
      ): void => {
        for (const param of node.params) {
          for (const carrier of astParamTypedCarriersTransformer({ param })) {
            const name =
              carrier.type === AST_NODE_TYPES.Identifier
                ? carrier.name
                : carrier.key.type === AST_NODE_TYPES.Identifier
                  ? carrier.key.name
                  : undefined;
            const typeNode = carrier.typeAnnotation?.typeAnnotation;
            const candidate =
              typeNode === undefined ? null : astOwnerTypeCandidateTransformer({ typeNode });
            if (name === undefined || candidate === null) {
              continue;
            }

            const ownerIndex = ownerIndexBuildBroker({ rootDir });
            const packageName = ownerIndexFilePackageTransformer({
              ownerIndex,
              filePath: filename,
            });
            const match =
              packageName === undefined
                ? undefined
                : ownerIndexNameMatchTransformer({ ownerIndex, packageName, name });
            const ownerType = match?.owner.typeName;
            if (packageName === undefined || match === undefined || ownerType === undefined) {
              continue;
            }

            // A plain type reference only stands for the owner's field when it is that field's own brand.
            const { owner, field } = match;
            if (
              candidate.type === AST_NODE_TYPES.TSTypeReference &&
              (candidate.typeName.type === AST_NODE_TYPES.Identifier
                ? candidate.typeName.name
                : undefined) !== field.brandText
            ) {
              continue;
            }

            ctx.report({
              node: candidate,
              messageId: 'paramNotOwnerType',
              data: { name, owner: owner.ownerName, field: field.key, Owner: ownerType },
              fix: (fixer) => {
                const [program] = programs;
                if (program === undefined) {
                  return null;
                }

                const replacement = fixer.replaceText(candidate, `${ownerType}['${field.key}']`);
                if (
                  owner.filePath === filename ||
                  isAstNameImportedGuard({ program, name: ownerType })
                ) {
                  return replacement;
                }

                const source = ownerIndexImportSourceTransformer({
                  ownerFilePath: owner.filePath,
                  ownerPackageName: owner.packageName,
                  filePath: filename,
                  packageName,
                });
                const anchor = astImportInsertAnchorTransformer({
                  program,
                  source,
                  importKind: 'type',
                });
                const text = importInsertTextTransformer({
                  anchor,
                  name: ownerType,
                  source,
                  importKind: 'type',
                });
                const [first] = program.body;
                if (anchor === null) {
                  return first === undefined
                    ? replacement
                    : [replacement, fixer.insertTextBefore(first, text)];
                }
                return [replacement, fixer.insertTextAfter(anchor, text)];
              },
            });
          }
        }
      },
    };
  },
});
