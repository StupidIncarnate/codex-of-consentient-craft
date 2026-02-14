/**
 * PURPOSE: Walks AST body collecting value exports while checking for forbidden export patterns
 *
 * USAGE:
 * const exports = collectExportsLayerBroker({node, context, filename, firstFolder});
 * // Returns array of collected exports, or null if a fatal forbidden pattern was reported
 */
import type { CollectedExport } from '../../../contracts/collected-export/collected-export-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import type { Identifier } from '@dungeonmaster/shared/contracts';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';

export const collectExportsLayerBroker = ({
  node,
  context,
  filename,
  firstFolder,
}: {
  node: Tsestree;
  context: EslintContext;
  filename: string;
  firstFolder: Identifier;
}): CollectedExport[] | null => {
  const exports: CollectedExport[] = [];
  const { body } = node;

  if (!body || !Array.isArray(body)) {
    return exports;
  }

  for (const statement of body) {
    if (statement.type === 'ExportDefaultDeclaration') {
      context.report({ node, messageId: 'noDefaultExport' });
      return null;
    }

    if (statement.type === 'ExportAllDeclaration') {
      context.report({ node, messageId: 'noNamespaceExport' });
      return null;
    }

    if (statement.type === 'ExportNamedDeclaration') {
      const isTypeOnly = statement.exportKind === 'type';
      const { declaration, source } = statement;
      const hasSource = source !== null && source !== undefined;
      const hasDeclaration = declaration !== null && declaration !== undefined;

      if (!isTypeOnly && (hasSource || !hasDeclaration)) {
        context.report({
          node,
          messageId: 'noReExport',
          data: { folderType: firstFolder },
        });
        return null;
      }

      if (!isTypeOnly && declaration) {
        if (declaration.type === 'VariableDeclaration' && declaration.declarations) {
          for (const declarator of declaration.declarations) {
            if (declarator.id?.type === 'Identifier' && declarator.id.name) {
              const { init } = declarator;
              const isArrowFunction = init?.type === 'ArrowFunctionExpression';

              if (hasFileSuffixGuard({ filename, suffix: 'proxy' }) && !isArrowFunction) {
                const actualType =
                  init?.type === 'Identifier'
                    ? 're-exported variable'
                    : init?.type === 'FunctionExpression'
                      ? 'function expression'
                      : (init?.type ?? 'non-function value');
                context.report({
                  node,
                  messageId: 'proxyMustBeArrowFunction',
                  data: { actualType },
                });
                return null;
              }

              if (firstFolder === 'adapters' && !isArrowFunction) {
                const actualType =
                  init?.type === 'Identifier'
                    ? 're-exported variable'
                    : (init?.type ?? 'non-function value');
                context.report({
                  node,
                  messageId: 'adapterMustBeArrowFunction',
                  data: { actualType },
                });
                return null;
              }

              exports.push({
                type: 'VariableDeclaration' as CollectedExport['type'],
                name: declarator.id.name,
                isTypeOnly: false,
              });
            }
          }
        }

        if (declaration.type === 'FunctionDeclaration' && declaration.id?.name) {
          if (hasFileSuffixGuard({ filename, suffix: 'proxy' })) {
            context.report({
              node,
              messageId: 'proxyMustBeArrowFunction',
              data: { actualType: 'function declaration' },
            });
            return null;
          }
          if (firstFolder === 'adapters') {
            context.report({
              node,
              messageId: 'adapterMustBeArrowFunction',
              data: { actualType: 'function declaration' },
            });
            return null;
          }
          exports.push({
            type: 'FunctionDeclaration' as CollectedExport['type'],
            name: declaration.id.name,
            isTypeOnly: false,
          });
        }

        if (declaration.type === 'ClassDeclaration' && declaration.id?.name) {
          if (hasFileSuffixGuard({ filename, suffix: 'proxy' })) {
            context.report({
              node,
              messageId: 'proxyMustBeArrowFunction',
              data: { actualType: 'class' },
            });
            return null;
          }
          if (firstFolder === 'adapters') {
            context.report({
              node,
              messageId: 'adapterMustBeArrowFunction',
              data: { actualType: 'class' },
            });
            return null;
          }
          exports.push({
            type: 'ClassDeclaration' as CollectedExport['type'],
            name: declaration.id.name,
            isTypeOnly: false,
          });
        }
      }
    }
  }

  return exports;
};
