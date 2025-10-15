import type { Rule } from '../../../adapters/eslint/eslint-rule-adapter';

interface ObjectPatternParam {
  type: string;
  properties?: {
    type: string;
  }[];
  left?: ObjectPatternParam;
  typeAnnotation?: {
    typeAnnotation?: {
      type: string;
      typeName?: {
        type: string;
        name?: string;
      };
    };
  };
}

interface FunctionLike {
  params: ObjectPatternParam[];
  body?: {
    type: string;
    body?: unknown[];
    callee?: {
      type: string;
      object?: {
        type: string;
        name?: string;
      };
      property?: {
        type: string;
        name?: string;
      };
    };
    argument?: unknown;
  };
}

const isStubFile = ({ context }: { context: Rule.RuleContext }): boolean => {
  const filename = context.getFilename();
  return filename.endsWith('.stub.ts');
};

interface NodeWithParent {
  parent?: {
    type: string;
    parent?: {
      type: string;
      parent?: {
        type: string;
      };
    };
  };
}

const isExportedFunction = ({ node }: { node: unknown }): boolean => {
  const nodeWithParent = node as NodeWithParent;

  // Check if this arrow function is directly exported
  // Pattern: export const StubName = (...) => {...}
  // AST: ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression

  const { parent } = nodeWithParent;
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

const isSingleValueProperty = ({ funcNode }: { funcNode: FunctionLike }): boolean => {
  if (funcNode.params.length === 0) {
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

  const prop = properties[0] as { type: string; key?: { type: string; name?: string } };

  // Check if it's a single property named 'value'
  return prop.type === 'Property' && prop.key?.type === 'Identifier' && prop.key?.name === 'value';
};

const hasSpreadOperator = ({ funcNode }: { funcNode: FunctionLike }): boolean => {
  if (funcNode.params.length === 0) {
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

const usesStubArgumentType = ({ funcNode }: { funcNode: FunctionLike }): boolean => {
  if (funcNode.params.length === 0) {
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

const isContractParseCall = ({ node }: { node: unknown }): boolean => {
  const callNode = node as {
    type: string;
    callee?: {
      type: string;
      object?: { type: string; name?: string };
      property?: { type: string; name?: string };
    };
  };

  if (callNode.type !== 'CallExpression' || !callNode.callee) {
    return false;
  }

  const { callee } = callNode;
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

const objectHasContractParseSpread = ({ node }: { node: unknown }): boolean => {
  const objNode = node as {
    type: string;
    properties?: {
      type: string;
      argument?: unknown;
    }[];
  };

  if (objNode.type !== 'ObjectExpression' || !objNode.properties) {
    return false;
  }

  // Check if any property is a SpreadElement with contract.parse()
  return objNode.properties.some((prop) => {
    if (prop.type === 'SpreadElement' && prop.argument) {
      return isContractParseCall({ node: prop.argument });
    }
    return false;
  });
};

const usesContractParse = ({ funcNode }: { funcNode: FunctionLike }): boolean => {
  const { body } = funcNode;
  if (!body) {
    return false;
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
  if (body.type === 'BlockStatement' && body.body) {
    // Check if any statement is a return statement with contract.parse
    const hasContractParse = body.body.some((statement: unknown) => {
      const stmt = statement as {
        type: string;
        argument?: unknown;
      };

      if (stmt.type === 'ReturnStatement' && stmt.argument) {
        const arg = stmt.argument;
        // Direct call: return contract.parse({})
        if (isContractParseCall({ node: arg })) {
          return true;
        }
        // Spread in object: return { ...contract.parse({}), other: 'props' }
        if (objectHasContractParseSpread({ node: arg })) {
          return true;
        }
      }
      return false;
    });

    return hasContractParse;
  }

  return false;
};

export const enforceStubPatternsRuleBroker = (): Rule.RuleModule => ({
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
  create: (context: Rule.RuleContext) => {
    if (!isStubFile({ context })) {
      return {};
    }

    return {
      ArrowFunctionExpression: (node): void => {
        // Only check root exported stub functions, not nested arrow functions
        if (!isExportedFunction({ node })) {
          return;
        }

        const funcNode = node as FunctionLike;

        if (funcNode.params.length === 0) {
          return;
        }

        const hasSpread = hasSpreadOperator({ funcNode });
        const isSingleValue = isSingleValueProperty({ funcNode });
        const hasStubArgument = usesStubArgumentType({ funcNode });
        const hasContractParse = usesContractParse({ funcNode });

        // Exception: Allow ({ value }: { value: string }) for branded string stubs
        if (isSingleValue) {
          // Still check contract.parse() for single value stubs
          if (!hasContractParse) {
            context.report({
              node,
              messageId: 'useContractParse',
            });
          }
          return; // Skip other checks for single value pattern
        }

        // Check if function has spread operator in parameters
        if (!hasSpread) {
          const [firstParam] = funcNode.params;
          if (firstParam) {
            context.report({
              node: firstParam,
              messageId: 'useSpreadOperator',
            });
          }
          return; // Don't check other things if spread is missing
        }

        // If spread operator is present, check for StubArgument type
        if (!hasStubArgument) {
          const [firstParam] = funcNode.params;
          if (firstParam) {
            context.report({
              node: firstParam,
              messageId: 'useStubArgumentType',
            });
          }
        }

        // Check if contract.parse() is used
        if (!hasContractParse) {
          context.report({
            node,
            messageId: 'useContractParse',
          });
        }
      },
    };
  },
});
