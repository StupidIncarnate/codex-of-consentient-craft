import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { filePathContract } from '@questmaestro/shared/contracts';

interface MemberExpressionNode {
  type: 'MemberExpression';
  object: { type: string; name?: string };
  property: { type: string; name?: string };
}

interface LiteralNode {
  type: 'Literal';
  value?: unknown;
}

interface CallExpressionNode {
  type: 'CallExpression';
  callee?: unknown;
  arguments?: unknown[];
}

interface ImportExpressionNode {
  type: 'ImportExpression';
  source?: unknown;
}

const isMemberExpression = (node: unknown): node is MemberExpressionNode =>
  typeof node === 'object' && node !== null && 'type' in node && node.type === 'MemberExpression';

const isCallExpression = (node: unknown): node is CallExpressionNode =>
  typeof node === 'object' && node !== null && 'type' in node && node.type === 'CallExpression';

const isLiteral = (node: unknown): node is LiteralNode =>
  typeof node === 'object' && node !== null && 'type' in node && node.type === 'Literal';

const isImportExpression = (node: unknown): node is ImportExpressionNode =>
  typeof node === 'object' && node !== null && 'type' in node && node.type === 'ImportExpression';

const ALLOWED_PATH_CONTRACTS = [
  'filePathContract',
  'absoluteFilePathContract',
  'relativeFilePathContract',
] as const;

const isContractParseCall = (node: unknown): boolean => {
  if (!isCallExpression(node)) {
    return false;
  }

  const { callee } = node;

  if (!isMemberExpression(callee)) {
    return false;
  }

  // Check if it's a .parse() call (safeParse not allowed for require/import)
  const methodName = callee.property.name;
  if (methodName !== 'parse') {
    return false;
  }

  // Check if the object is an allowed path contract
  const objectName = callee.object.name;
  if (!objectName) {
    return false;
  }

  // Allow any of the whitelisted path contracts
  const isAllowedPathContract = ALLOWED_PATH_CONTRACTS.includes(
    objectName as (typeof ALLOWED_PATH_CONTRACTS)[number],
  );

  return isAllowedPathContract;
};

export const requireContractValidationRuleBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description: 'Require contract.parse() validation for require() and import() calls',
      },
      messages: {
        requireNeedsContract:
          'require() must use path contract validation or file path literals. Valid: require("./file.ts") OR require(filePathContract.parse(path)). Import contract: import { filePathContract } from "@questmaestro/shared/contracts"',
        importNeedsContract:
          'import() must use path contract validation or file path literals. Valid: import("./file.ts") OR import(filePathContract.parse(path)). Import contract: import { filePathContract } from "@questmaestro/shared/contracts"',
        stringLiteralAllowed:
          'require/import string literals must be file paths (./, ../, /), not npm modules. Invalid: require("lodash"). Valid: require("./local-file.ts") OR require(filePathContract.parse(dynamicPath)). Import contract: import { filePathContract } from "@questmaestro/shared/contracts"',
      },
      schema: [],
    },
  }),
  create: (context: unknown) => {
    const ctx = context as EslintContext;
    return {
      // Handle require() calls
      'CallExpression[callee.name="require"]': (node: Tsestree): void => {
        // Type guard
        if (!isCallExpression(node)) {
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
        if (isLiteral(arg) && typeof arg.value === 'string') {
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
        if (!isContractParseCall(arg)) {
          ctx.report({
            node,
            messageId: 'requireNeedsContract',
          });
        }
      },

      // Handle dynamic import() calls
      ImportExpression: (node: Tsestree): void => {
        // Type guard
        if (!isImportExpression(node)) {
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
        if (isLiteral(source) && typeof source.value === 'string') {
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
        if (!isContractParseCall(source)) {
          ctx.report({
            node,
            messageId: 'importNeedsContract',
          });
        }
      },
    };
  },
});
