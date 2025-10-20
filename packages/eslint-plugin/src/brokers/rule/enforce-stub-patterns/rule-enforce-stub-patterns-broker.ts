import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';

const isExportedFunction = ({ node }: { node: Tsestree }): boolean => {
  // Check if this arrow function is directly exported
  // Pattern: export const StubName = (...) => {...}
  // AST: ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression

  const { parent } = node;
  if (!parent || parent.type !== 'VariableDeclarator') {
    return false;
  }

  const grandparent = parent.parent;
  if (!grandparent || grandparent.type !== 'VariableDeclaration') {
    return false;
  }

  const greatGrandparent = grandparent.parent;
  if (!greatGrandparent || greatGrandparent.type !== 'ExportNamedDeclaration') {
    return false;
  }

  return true;
};

const isSingleValueProperty = ({ funcNode }: { funcNode: Tsestree }): boolean => {
  if (!funcNode.params || funcNode.params.length === 0) {
    return false;
  }

  const [firstParam] = funcNode.params;
  if (!firstParam) {
    return false;
  }

  // Handle both ObjectPattern and AssignmentPattern wrapping ObjectPattern
  const pattern =
    firstParam.type === 'ObjectPattern'
      ? firstParam
      : firstParam.type === 'AssignmentPattern' && firstParam.left
        ? firstParam.left
        : null;

  if (!pattern || pattern.type !== 'ObjectPattern') {
    return false;
  }

  const { properties } = pattern;
  if (!properties || properties.length !== 1) {
    return false;
  }

  const prop = properties[0];
  if (!prop) {
    return false;
  }

  // Check if it's a single property named 'value'
  return prop.type === 'Property' && prop.key?.type === 'Identifier' && prop.key?.name === 'value';
};

const hasSpreadOperator = ({ funcNode }: { funcNode: Tsestree }): boolean => {
  if (!funcNode.params || funcNode.params.length === 0) {
    return false;
  }

  const [firstParam] = funcNode.params;
  if (!firstParam) {
    return false;
  }

  // Handle both ObjectPattern and AssignmentPattern wrapping ObjectPattern
  const pattern =
    firstParam.type === 'ObjectPattern'
      ? firstParam
      : firstParam.type === 'AssignmentPattern' && firstParam.left
        ? firstParam.left
        : null;

  if (!pattern || pattern.type !== 'ObjectPattern') {
    return false;
  }

  const { properties } = pattern;
  if (!properties || properties.length === 0) {
    return false;
  }

  // Must have exactly one property and it must be a RestElement
  return properties.length === 1 && properties[0]?.type === 'RestElement';
};

const usesStubArgumentType = ({ funcNode }: { funcNode: Tsestree }): boolean => {
  if (!funcNode.params || funcNode.params.length === 0) {
    return false;
  }

  const [firstParam] = funcNode.params;
  if (!firstParam) {
    return false;
  }

  // Get the type annotation - could be on AssignmentPattern or ObjectPattern
  const typeAnnotation = firstParam.typeAnnotation || firstParam.left?.typeAnnotation;

  if (!typeAnnotation?.typeAnnotation) {
    return false;
  }

  const typeNode = typeAnnotation.typeAnnotation;

  // Check if it's a TSTypeReference with name 'StubArgument'
  if (typeNode.type !== 'TSTypeReference') {
    return false;
  }

  const { typeName } = typeNode;
  if (!typeName || typeName.type !== 'Identifier') {
    return false;
  }

  return typeName.name === 'StubArgument';
};

const isContractParseCall = ({ node }: { node: Tsestree }): boolean => {
  if (node.type !== 'CallExpression' || !node.callee) {
    return false;
  }

  const { callee } = node;
  if (callee.type !== 'MemberExpression') {
    return false;
  }

  const { object, property } = callee;
  return Boolean(
    object &&
      object.type === 'Identifier' &&
      object.name &&
      object.name.endsWith('Contract') &&
      property &&
      property.type === 'Identifier' &&
      property.name === 'parse',
  );
};

const objectHasContractParseSpread = ({ node }: { node: Tsestree }): boolean => {
  if (node.type !== 'ObjectExpression' || !node.properties) {
    return false;
  }

  // Check if any property is a SpreadElement with contract.parse()
  return node.properties.some((prop) => {
    if (prop.type === 'SpreadElement' && prop.argument) {
      return isContractParseCall({ node: prop.argument });
    }
    return false;
  });
};

const usesContractParse = ({ funcNode }: { funcNode: Tsestree }): boolean => {
  const { body } = funcNode;
  if (!body) {
    return false;
  }

  // body can be an array (BlockStatement.body) or a single node (arrow function expression)
  if (Array.isArray(body)) {
    return false; // This shouldn't happen at this level
  }

  // Handle arrow function with expression body: () => contract.parse({})
  if (body.type === 'CallExpression') {
    return isContractParseCall({ node: body });
  }

  // Handle arrow function with expression body: () => ({ ...contract.parse({}) })
  if (body.type === 'ObjectExpression') {
    return objectHasContractParseSpread({ node: body });
  }

  // Handle arrow function or regular function with block body: () => { return contract.parse({}) }
  if (body.type === 'BlockStatement' && body.body && Array.isArray(body.body)) {
    // Check if contract.parse() is called anywhere in the function
    const hasContractParse = body.body.some((statement) => {
      // Check return statements
      if (statement.type === 'ReturnStatement' && statement.argument) {
        // Direct call: return contract.parse({})
        if (isContractParseCall({ node: statement.argument })) {
          return true;
        }
        // Spread in object: return { ...contract.parse({}), other: 'props' }
        if (objectHasContractParseSpread({ node: statement.argument })) {
          return true;
        }
      }

      // Check variable declarations: const validated = contract.parse({})
      if (statement.type === 'VariableDeclaration' && statement.declarations) {
        return statement.declarations.some((decl) => {
          if (decl.init) {
            return isContractParseCall({ node: decl.init });
          }
          return false;
        });
      }

      return false;
    });

    return hasContractParse;
  }

  return false;
};

export const ruleEnforceStubPatternsBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description: 'Enforce stub function patterns: spread operator and StubArgument type',
      },
      messages: {
        useSpreadOperator:
          'Stub functions must use spread operator in parameters: ({ ...props }: StubArgument<Type> = {})',
        useStubArgumentType:
          'Stub functions must use StubArgument<Type> from @questmaestro/shared/@types',
        useContractParse:
          'Stub functions must return contract.parse() to validate and brand the output',
      },
      schema: [],
    },
  }),
  create: (context: unknown) => {
    const ctx = context as EslintContext;
    const filename = String(ctx.getFilename?.() ?? '');
    if (!hasFileSuffixGuard({ filename, suffix: 'stub' })) {
      return {};
    }

    return {
      ArrowFunctionExpression: (node: Tsestree): void => {
        // Only check root exported stub functions, not nested arrow functions
        if (!isExportedFunction({ node })) {
          return;
        }

        if (!node.params || node.params.length === 0) {
          return;
        }

        const hasSpread = hasSpreadOperator({ funcNode: node });
        const isSingleValue = isSingleValueProperty({ funcNode: node });
        const hasStubArgument = usesStubArgumentType({ funcNode: node });
        const hasContractParse = usesContractParse({ funcNode: node });

        // Exception: Allow ({ value }: { value: string }) for branded string stubs
        if (isSingleValue) {
          // Still check contract.parse() for single value stubs
          if (!hasContractParse) {
            ctx.report({
              node,
              messageId: 'useContractParse',
            });
          }
          return; // Skip other checks for single value pattern
        }

        // Check if function has spread operator in parameters
        if (!hasSpread) {
          const [firstParam] = node.params;
          if (firstParam) {
            ctx.report({
              node: firstParam,
              messageId: 'useSpreadOperator',
            });
          }
          return; // Don't check other things if spread is missing
        }

        // If spread operator is present, check for StubArgument type
        if (!hasStubArgument) {
          const [firstParam] = node.params;
          if (firstParam) {
            ctx.report({
              node: firstParam,
              messageId: 'useStubArgumentType',
            });
          }
        }

        // Check if contract.parse() is used
        if (!hasContractParse) {
          ctx.report({
            node,
            messageId: 'useContractParse',
          });
        }
      },
    };
  },
});
