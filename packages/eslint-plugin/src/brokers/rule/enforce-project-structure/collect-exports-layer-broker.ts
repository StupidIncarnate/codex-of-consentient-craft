/**
 * PURPOSE: Walks AST body collecting value exports while checking for forbidden export patterns
 *
 * USAGE:
 * const exports = collectExportsLayerBroker({node, context, filename, firstFolder});
 * // Returns array of collected exports, or null if a fatal forbidden pattern was reported
 */
import type { CollectedExport } from '../../../contracts/collected-export/collected-export-contract';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { identifierContract } from '@dungeonmaster/shared/contracts';
import type { Identifier } from '@dungeonmaster/shared/contracts';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';

export const collectExportsLayerBroker = ({
  node,
  context,
  filename,
  firstFolder,
}: {
  node: TSESTree.Program;
  context: TSESLint.RuleContext<string, unknown[]>;
  filename: string;
  firstFolder: Identifier;
}): CollectedExport[] | null => {
  const exports: CollectedExport[] = [];

  for (const statement of node.body) {
    if (statement.type === AST_NODE_TYPES.ExportDefaultDeclaration) {
      context.report({ node, messageId: 'noDefaultExport' });
      return null;
    }

    if (statement.type === AST_NODE_TYPES.ExportAllDeclaration) {
      context.report({ node, messageId: 'noNamespaceExport' });
      return null;
    }

    if (statement.type === AST_NODE_TYPES.ExportNamedDeclaration) {
      const isTypeOnly = statement.exportKind === 'type';
      const { declaration, source } = statement;
      const hasSource = source !== null;
      const hasDeclaration = declaration !== null;

      if (!isTypeOnly && (hasSource || !hasDeclaration)) {
        context.report({
          node,
          messageId: 'noReExport',
          data: { folderType: firstFolder },
        });
        return null;
      }

      // `export type X = ...` and `export interface X` are collected as type entries so a
      // types-only contract file can be told apart from an empty one; `export type { X }` and
      // `export type { X } from` carry no declaration and stay skipped.
      if (
        isTypeOnly &&
        declaration &&
        (declaration.type === AST_NODE_TYPES.TSTypeAliasDeclaration ||
          declaration.type === AST_NODE_TYPES.TSInterfaceDeclaration)
      ) {
        exports.push({
          type: declaration.type as CollectedExport['type'],
          name: identifierContract.parse(declaration.id.name),
          isTypeOnly: true,
        });
      }

      if (!isTypeOnly && declaration) {
        if (declaration.type === AST_NODE_TYPES.VariableDeclaration) {
          for (const declarator of declaration.declarations) {
            if (declarator.id.type === AST_NODE_TYPES.Identifier) {
              const { init } = declarator;
              const isArrowFunction = init?.type === AST_NODE_TYPES.ArrowFunctionExpression;

              if (hasFileSuffixGuard({ filename, suffix: 'proxy' }) && !isArrowFunction) {
                const actualType =
                  init?.type === AST_NODE_TYPES.Identifier
                    ? 're-exported variable'
                    : init?.type === AST_NODE_TYPES.FunctionExpression
                      ? 'function expression'
                      : (init?.type ?? 'non-function value');
                context.report({
                  node,
                  messageId: 'proxyMustBeArrowFunction',
                  data: { actualType },
                });
                return null;
              }

              exports.push({
                type: 'VariableDeclaration' as CollectedExport['type'],
                name: identifierContract.parse(declarator.id.name),
                isTypeOnly: false,
              });
            }
          }
        }

        if (declaration.type === AST_NODE_TYPES.FunctionDeclaration && declaration.id?.name) {
          if (hasFileSuffixGuard({ filename, suffix: 'proxy' })) {
            context.report({
              node,
              messageId: 'proxyMustBeArrowFunction',
              data: { actualType: 'function declaration' },
            });
            return null;
          }
          exports.push({
            type: 'FunctionDeclaration' as CollectedExport['type'],
            name: identifierContract.parse(declaration.id.name),
            isTypeOnly: false,
          });
        }

        if (declaration.type === AST_NODE_TYPES.ClassDeclaration && declaration.id?.name) {
          if (hasFileSuffixGuard({ filename, suffix: 'proxy' })) {
            context.report({
              node,
              messageId: 'proxyMustBeArrowFunction',
              data: { actualType: 'class' },
            });
            return null;
          }
          exports.push({
            type: 'ClassDeclaration' as CollectedExport['type'],
            name: identifierContract.parse(declaration.id.name),
            isTypeOnly: false,
          });
        }
      }
    }
  }

  return exports;
};
