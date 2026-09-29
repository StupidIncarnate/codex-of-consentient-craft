/**
 * PURPOSE: Creates ESLint rule that forbids re-exporting types that were imported (except in index.ts files)
 *
 * USAGE:
 * const rule = ruleForbidTypeReexportBroker();
 * // Returns RuleModule that prevents type re-exports outside of index.ts barrel files
 *
 * WHEN-TO-USE: When registering ESLint rules to enforce importing types directly from their source
 * WHEN-NOT-TO-USE: Automatically allows type re-exports in index.ts files for barrel exports
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const ruleForbidTypeReexportBroker = (): TSESLint.RuleModule<'noTypeReexport'> => ({
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
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const importedTypes = new Set<PropertyKey>();
    const ctx = context;
    const { filename } = ctx;

    // Allow re-exports in index.ts files
    if (filename.endsWith('index.ts')) {
      return {};
    }

    return {
      ImportDeclaration: (node: TSESTree.ImportDeclaration): void => {
        // Track import type declarations
        if (node.importKind === 'type') {
          const { specifiers } = node;
          if (Array.isArray(specifiers)) {
            for (const specifier of specifiers) {
              if (specifier.type === AST_NODE_TYPES.ImportSpecifier) {
                const localName = specifier.local.name;
                if (localName) {
                  importedTypes.add(localName);
                }
              }
            }
          }
        }
      },

      ExportNamedDeclaration: (node: TSESTree.ExportNamedDeclaration): void => {
        // Check if this is a type re-export
        if (node.exportKind === 'type') {
          for (const specifier of node.specifiers) {
            const exportedName =
              specifier.exported.type === AST_NODE_TYPES.Identifier
                ? specifier.exported.name
                : undefined;
            if (exportedName && importedTypes.has(exportedName)) {
              ctx.report({
                node: specifier,
                messageId: 'noTypeReexport',
              });
            }
          }
        }
      },
    };
  },
});
