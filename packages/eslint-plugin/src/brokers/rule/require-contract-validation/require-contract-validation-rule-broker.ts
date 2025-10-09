import type { Rule } from '../../../adapters/eslint/eslint-rule-adapter';
import { filePathContract } from '@questmaestro/shared/contracts';

interface MemberExpressionNode {
  type: 'MemberExpression';
  object: { type: string; name?: string };
  property: { type: string; name?: string };
}

interface CallExpressionNode {
  type: 'CallExpression';
  callee: unknown;
}

const isMemberExpression = (node: unknown): node is MemberExpressionNode =>
  typeof node === 'object' && node !== null && 'type' in node && node.type === 'MemberExpression';

const isCallExpression = (node: unknown): node is CallExpressionNode =>
  typeof node === 'object' && node !== null && 'type' in node && node.type === 'CallExpression';

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

export const requireContractValidationRuleBroker = (): Rule.RuleModule => ({
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
  create: (context: Rule.RuleContext) => ({
    // Handle require() calls
    'CallExpression[callee.name="require"]': (node): void => {
      // Type guard
      if (node.type !== 'CallExpression') {
        return;
      }

      const arg = node.arguments[0];

      if (!arg) {
        context.report({
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
          context.report({
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
        context.report({
          node,
          messageId: 'requireNeedsContract',
        });
      }
    },

    // Handle dynamic import() calls
    ImportExpression: (node): void => {
      // Type guard
      if (node.type !== 'ImportExpression') {
        return;
      }

      const { source } = node;

      if (!source) {
        context.report({
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
          context.report({
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
        context.report({
          node,
          messageId: 'importNeedsContract',
        });
      }
    },
  }),
});
