/**
 * PURPOSE: Creates ESLint rule that forbids re-exporting types that were imported (except in index.ts files)
 *
 * USAGE:
 * const rule = ruleForbidTypeReexportBroker();
 * // Returns EslintRule that prevents type re-exports outside of index.ts barrel files
 *
 * WHEN-TO-USE: When registering ESLint rules to enforce importing types directly from their source
 * WHEN-NOT-TO-USE: Automatically allows type re-exports in index.ts files for barrel exports
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

export const ruleForbidTypeReexportBroker = (): EslintRule => {
  const importedTypes = new Set<PropertyKey>();

  return {
    ...eslintRuleContract.parse({
      meta: {
        type: 'problem',
        docs: {
          description: 'Forbid re-exporting types that were imported (except in index.ts files)',
        },
        messages: {
          noTypeReexport:
            "Type re-exports are only allowed in index.ts. You need to import types directly from the source, unless you're running into a conflicting eslint rule, in which case you need to stop and evaluate root cause. If you're trying to forcefully retype something in a test, use `as never as Record<PropertyKey, never>` or similar type assertions after creating valid stubs.",
        },
        schema: [],
      },
    }),
    create: (context: EslintContext) => {
      const ctx = context;
      const filename = String(ctx.getFilename?.() ?? '');

      // Allow re-exports in index.ts files
      if (filename.endsWith('index.ts')) {
        return {};
      }

      return {
        ImportDeclaration: (node: Tsestree): void => {
          // Track import type declarations
          if (node.importKind === 'type') {
            const { specifiers } = node;
            if (Array.isArray(specifiers)) {
              for (const specifier of specifiers) {
                if (specifier.type === 'ImportSpecifier') {
                  const localName = specifier.local?.name;
                  if (localName) {
                    importedTypes.add(String(localName));
                  }
                }
              }
            }
          }
        },

        ExportNamedDeclaration: (node: Tsestree): void => {
          // Check if this is a type re-export
          if (node.exportKind === 'type') {
            const { specifiers } = node;
            if (Array.isArray(specifiers)) {
              for (const specifier of specifiers) {
                if (specifier.type === 'ExportSpecifier') {
                  const exportedName = specifier.exported?.name;
                  if (exportedName && importedTypes.has(String(exportedName))) {
                    ctx.report({
                      node: specifier,
                      messageId: 'noTypeReexport',
                    });
                  }
                }
              }
            }
          }
        },
      };
    },
  };
};
