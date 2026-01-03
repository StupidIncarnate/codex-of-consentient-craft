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
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { filePathContract } from '@dungeonmaster/shared/contracts';

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
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = ctx.filename ?? ctx.getFilename?.() ?? '';

    // Allow raw import() in @dungeonmaster/shared's dynamic-import adapter - it IS the foundation wrapper
    const isSharedDynamicImportAdapter =
      (filename.includes('@dungeonmaster/shared') || filename.includes('packages/shared')) &&
      filename.includes('/adapters/runtime/dynamic-import/');

    return {
      // Handle require() calls
      'CallExpression[callee.name="require"]': (node: Tsestree): void => {
        if (isSharedDynamicImportAdapter) {
          return;
        }
        const arg = node.arguments?.[0];

        if (!arg) {
          ctx.report({
            node,
            messageId: 'requireNeedsContract',
          });
          return;
        }

        // Allow string literals that are valid file paths (not npm modules)
        if (arg.type === 'Literal' && typeof arg.value === 'string') {
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
        const objectName = arg.callee?.object?.name;
        const isValidContractCall =
          arg.type === 'CallExpression' &&
          arg.callee &&
          arg.callee.type === 'MemberExpression' &&
          arg.callee.property &&
          arg.callee.property.name === 'parse' &&
          objectName !== undefined &&
          objectName !== '' &&
          (objectName === 'filePathContract' ||
            objectName === 'absoluteFilePathContract' ||
            objectName === 'relativeFilePathContract');

        if (isValidContractCall === false) {
          ctx.report({
            node,
            messageId: 'requireNeedsContract',
          });
        }
      },

      // Handle dynamic import() calls
      ImportExpression: (node: Tsestree): void => {
        if (isSharedDynamicImportAdapter) {
          return;
        }
        const { source } = node;

        if (!source) {
          ctx.report({
            node,
            messageId: 'importNeedsContract',
          });
          return;
        }

        // Allow string literals that are valid file paths (not npm modules)
        if (source.type === 'Literal' && typeof source.value === 'string') {
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
        const objectName = source.callee?.object?.name;
        const isValidContractCall =
          source.type === 'CallExpression' &&
          source.callee &&
          source.callee.type === 'MemberExpression' &&
          source.callee.property &&
          source.callee.property.name === 'parse' &&
          objectName !== undefined &&
          objectName !== '' &&
          (objectName === 'filePathContract' ||
            objectName === 'absoluteFilePathContract' ||
            objectName === 'relativeFilePathContract');

        if (isValidContractCall === false) {
          ctx.report({
            node,
            messageId: 'importNeedsContract',
          });
        }
      },
    };
  },
});
