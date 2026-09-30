/**
 * PURPOSE: Creates ESLint rule that limits require() and import() to file path literals; a dynamic path goes through the gateway dynamicImport wrapper
 *
 * USAGE:
 * const rule = ruleRequireContractValidationBroker();
 * // Returns RuleModule that reports require(variable) and import(variable) and names dynamicImport from #gateway/node/module
 *
 * WHEN-TO-USE: When registering ESLint rules to keep dynamic module loading inside the gateway
 * WHEN-NOT-TO-USE: String literals with valid file paths (./, ../, /, C:\) are automatically allowed
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isGatewayFileGuard } from '../../../guards/is-gateway-file/is-gateway-file-guard';

export const ruleRequireContractValidationBroker = (): TSESLint.RuleModule<
  'requireNeedsContract' | 'importNeedsContract' | 'stringLiteralAllowed'
> => ({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Limit require() and import() to file path literals; dynamic paths use the gateway dynamicImport',
    },
    messages: {
      requireNeedsContract:
        'require() takes a file path literal only. Valid: require("./file.ts"). For a dynamic path, call dynamicImport({ path }) from "#gateway/node/module" and parse the returned namespace with a contract.',
      importNeedsContract:
        'import() takes a file path literal only. Valid: import("./file.ts"). For a dynamic path, call dynamicImport({ path }) from "#gateway/node/module" and parse the returned namespace with a contract.',
      stringLiteralAllowed:
        'require/import string literals must be file paths (./, ../, /, C:\\), not npm modules. Invalid: require("lodash"). Valid: require("./local-file.ts"). For a dynamic path, call dynamicImport({ path }) from "#gateway/node/module".',
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const { filename } = ctx;

    // A gateway file is where dynamicImport itself lives, and it can never import our own
    // workspace contracts (brief item 7: no contracts for outside packages). Exempt it by the
    // same shared guard every other gateway carve-out uses, rather than a hardcoded path.
    const isExempt = isGatewayFileGuard({ filename });

    return {
      // Handle require() calls
      'CallExpression[callee.name="require"]': (node: TSESTree.CallExpression): void => {
        if (isExempt) {
          return;
        }
        const [arg] = node.arguments;

        if (!arg) {
          ctx.report({
            node,
            messageId: 'requireNeedsContract',
          });
          return;
        }

        // Allow string literals that are valid file paths (not npm modules). A drive letter is
        // a cased character, so lower and upper case differ; brokers may not hold a regex.
        if (arg.type === AST_NODE_TYPES.Literal && typeof arg.value === 'string') {
          const isFilePath =
            arg.value.startsWith('/') ||
            arg.value.startsWith('./') ||
            arg.value.startsWith('../') ||
            (arg.value.charAt(0).toLowerCase() !== arg.value.charAt(0).toUpperCase() &&
              arg.value.startsWith(':\\', 1));

          if (!isFilePath) {
            // Not a valid file path (npm module or invalid)
            ctx.report({
              node,
              messageId: 'stringLiteralAllowed',
            });
            return;
          }

          // Valid file path string literal - allow it
          return;
        }

        ctx.report({
          node,
          messageId: 'requireNeedsContract',
        });
      },

      // Handle dynamic import() calls
      ImportExpression: (node: TSESTree.ImportExpression): void => {
        if (isExempt) {
          return;
        }
        const { source } = node;

        // Allow string literals that are valid file paths (not npm modules)
        if (source.type === AST_NODE_TYPES.Literal && typeof source.value === 'string') {
          const isFilePath =
            source.value.startsWith('/') ||
            source.value.startsWith('./') ||
            source.value.startsWith('../') ||
            (source.value.charAt(0).toLowerCase() !== source.value.charAt(0).toUpperCase() &&
              source.value.startsWith(':\\', 1));

          if (!isFilePath) {
            // Not a valid file path (npm module or invalid)
            ctx.report({
              node,
              messageId: 'stringLiteralAllowed',
            });
            return;
          }

          // Valid file path string literal - allow it
          return;
        }

        ctx.report({
          node,
          messageId: 'importNeedsContract',
        });
      },
    };
  },
});
