import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { isFileInFolderTypeGuard } from '../../../guards/is-file-in-folder-type/is-file-in-folder-type-guard';

export const ruleEnforceMagicArraysBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
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
  }),
  create: (context: unknown) => {
    const ctx = context as EslintContext;
    const filename = ctx.getFilename?.() ?? undefined;

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
      VariableDeclarator: (node: Tsestree): void => {
        const { id, init } = node;

        // Only check const declarations
        if (!id || !init) {
          return;
        }

        // Unwrap TSAsExpression (e.g., `as const`)
        let arrayExpression = init;
        if (init.type === 'TSAsExpression') {
          arrayExpression = init.expression ?? init;
        }

        // Check if it's an ArrayExpression
        if (arrayExpression.type !== 'ArrayExpression') {
          return;
        }

        const { elements } = arrayExpression;

        // Empty arrays are fine
        if (!elements || elements.length === 0) {
          return;
        }

        // Check if all elements are string literals
        const allStrings = elements.every((element) => {
          if (!element) {
            return false; // Sparse arrays
          }
          return (
            (element.type === 'Literal' && typeof element.value === 'string') ||
            element.type === 'TemplateLiteral'
          );
        });

        // Check if all elements are number literals
        const allNumbers = elements.every((element) => {
          if (!element) {
            return false; // Sparse arrays
          }
          return element.type === 'Literal' && typeof element.value === 'number';
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
