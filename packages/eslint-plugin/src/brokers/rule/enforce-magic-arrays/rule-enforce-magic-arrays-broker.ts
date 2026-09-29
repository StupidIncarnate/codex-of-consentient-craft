/**
 * PURPOSE: Forbids inline string/number array const declarations and requires using statics files instead
 *
 * USAGE:
 * const rule = ruleEnforceMagicArraysBroker();
 * // Returns ESLint rule that prevents `const x = ['a', 'b']` and requires moving arrays to statics files
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { isFileInFolderTypeGuard } from '../../../guards/is-file-in-folder-type/is-file-in-folder-type-guard';

export const ruleEnforceMagicArraysBroker = (): TSESLint.RuleModule<'forbidMagicArray'> => ({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Forbid inline string/number array const declarations - use statics files instead',
    },
    messages: {
      forbidMagicArray:
        'Magic {{arrayType}} arrays must be defined in statics files (statics/{{domain}}/{{domain}}-statics.ts), not scattered inline. Move this array to a statics file and reference it.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const { filename } = ctx;

    // Skip files that are allowed to have inline arrays
    if (!filename) {
      return {};
    }

    // Exempt test files, stub files, proxy files, and statics files
    if (
      hasFileSuffixGuard({ filename, suffix: 'test' }) ||
      hasFileSuffixGuard({ filename, suffix: 'stub' }) ||
      hasFileSuffixGuard({ filename, suffix: 'proxy' }) ||
      isFileInFolderTypeGuard({ filename, folderType: 'statics', suffix: 'statics' })
    ) {
      return {};
    }

    return {
      VariableDeclarator: (node: TSESTree.VariableDeclarator): void => {
        const { init } = node;

        // Only check const declarations
        if (!init) {
          return;
        }

        // Unwrap TSAsExpression (e.g., `as const`)
        let arrayExpression = init;
        if (init.type === AST_NODE_TYPES.TSAsExpression) {
          arrayExpression = init.expression;
        }

        // Check if it's an ArrayExpression
        if (arrayExpression.type !== AST_NODE_TYPES.ArrayExpression) {
          return;
        }

        const { elements } = arrayExpression;

        // Empty arrays are fine
        if (elements.length === 0) {
          return;
        }

        // Check if all elements are string literals
        const allStrings = elements.every((element) => {
          if (!element) {
            return false; // Sparse arrays
          }
          return (
            (element.type === AST_NODE_TYPES.Literal && typeof element.value === 'string') ||
            element.type === AST_NODE_TYPES.TemplateLiteral
          );
        });

        // Check if all elements are number literals
        const allNumbers = elements.every((element) => {
          if (!element) {
            return false; // Sparse arrays
          }
          return element.type === AST_NODE_TYPES.Literal && typeof element.value === 'number';
        });

        // Only report if it's a pure string or number array
        if (!allStrings && !allNumbers) {
          return;
        }

        const arrayType = allStrings ? 'string' : 'number';

        // Report violation
        ctx.report({
          node: init,
          messageId: 'forbidMagicArray',
          data: {
            arrayType,
            domain: 'your-domain',
          },
        });
      },
    };
  },
});
