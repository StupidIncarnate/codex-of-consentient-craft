/**
 * PURPOSE: Creates ESLint rule that requires contract.parse() validation for require() and import() calls with dynamic paths
 *
 * USAGE:
 * const rule = ruleRequireContractValidationBroker();
 * // Returns EslintRule that enforces require(filePathContract.parse(path)) pattern for dynamic imports
 *
 * WHEN-TO-USE: When registering ESLint rules to ensure dynamic module paths are validated
 * WHEN-NOT-TO-USE: String literals with valid file paths (./, ../, /) are automatically allowed
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import { isGatewayFileGuard } from '../../../guards/is-gateway-file/is-gateway-file-guard';

export const ruleRequireContractValidationBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description: 'Require contract.parse() validation for require() and import() calls',
      },
      messages: {
        requireNeedsContract:
          'require() must use path contract validation or file path literals. Valid: require("./file.ts") OR require(filePathContract.parse(path)). Import contract: import { filePathContract } from "@dungeonmaster/shared/contracts"',
        importNeedsContract:
          'import() must use path contract validation or file path literals. Valid: import("./file.ts") OR import(filePathContract.parse(path)). Import contract: import { filePathContract } from "@dungeonmaster/shared/contracts"',
        stringLiteralAllowed:
          'require/import string literals must be file paths (./, ../, /), not npm modules. Invalid: require("lodash"). Valid: require("./local-file.ts") OR require(filePathContract.parse(dynamicPath)). Import contract: import { filePathContract } from "@dungeonmaster/shared/contracts"',
      },
      schema: [],
    },
  }),
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const { filename } = ctx;

    // Allow raw import() in @dungeonmaster/shared's dynamic-import adapter - it IS the foundation wrapper
    const isSharedDynamicImportAdapter =
      (filename.includes('@dungeonmaster/shared') || filename.includes('packages/shared')) &&
      filename.includes('/adapters/runtime/dynamic-import/');

    // A gateway file can never import our own workspace contracts (brief item 7: no
    // contracts for outside packages), so it has no way to satisfy this rule's
    // filePathContract.parse() requirement. Exempt it by the same shared guard every
    // other gateway carve-out uses, rather than a hardcoded path.
    const isExempt = isSharedDynamicImportAdapter || isGatewayFileGuard({ filename });

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

        // Allow string literals that are valid file paths (not npm modules)
        if (arg.type === AST_NODE_TYPES.Literal && typeof arg.value === 'string') {
          const parseResult = filePathContract.safeParse(arg.value);

          if (!parseResult.success) {
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

        // Require contract.parse() wrapping
        const objectName =
          arg.type === AST_NODE_TYPES.CallExpression &&
          arg.callee.type === AST_NODE_TYPES.MemberExpression &&
          arg.callee.object.type === AST_NODE_TYPES.Identifier
            ? arg.callee.object.name
            : undefined;
        const isValidContractCall =
          arg.type === AST_NODE_TYPES.CallExpression &&
          arg.callee.type === AST_NODE_TYPES.MemberExpression &&
          arg.callee.property.type === AST_NODE_TYPES.Identifier &&
          arg.callee.property.name === 'parse' &&
          objectName !== undefined &&
          (objectName === 'filePathContract' ||
            objectName === 'absoluteFilePathContract' ||
            objectName === 'relativeFilePathContract');

        if (!isValidContractCall) {
          ctx.report({
            node,
            messageId: 'requireNeedsContract',
          });
        }
      },

      // Handle dynamic import() calls
      ImportExpression: (node: TSESTree.ImportExpression): void => {
        if (isExempt) {
          return;
        }
        const { source } = node;

        // Allow string literals that are valid file paths (not npm modules)
        if (source.type === AST_NODE_TYPES.Literal && typeof source.value === 'string') {
          const parseResult = filePathContract.safeParse(source.value);

          if (!parseResult.success) {
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

        // Require contract.parse() wrapping
        const objectName =
          source.type === AST_NODE_TYPES.CallExpression &&
          source.callee.type === AST_NODE_TYPES.MemberExpression &&
          source.callee.object.type === AST_NODE_TYPES.Identifier
            ? source.callee.object.name
            : undefined;
        const isValidContractCall =
          source.type === AST_NODE_TYPES.CallExpression &&
          source.callee.type === AST_NODE_TYPES.MemberExpression &&
          source.callee.property.type === AST_NODE_TYPES.Identifier &&
          source.callee.property.name === 'parse' &&
          objectName !== undefined &&
          (objectName === 'filePathContract' ||
            objectName === 'absoluteFilePathContract' ||
            objectName === 'relativeFilePathContract');

        if (!isValidContractCall) {
          ctx.report({
            node,
            messageId: 'importNeedsContract',
          });
        }
      },
    };
  },
});
