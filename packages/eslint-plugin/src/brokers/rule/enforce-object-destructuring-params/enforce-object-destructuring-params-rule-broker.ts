import type { Rule } from '../../../adapters/eslint/eslint-rule-adapter';

interface FunctionLike {
  params: {
    type: string;
    left?: {
      type: string;
    };
  }[];
  parent?: {
    type: string;
  };
}

const isCallbackFunction = ({ funcNode }: { funcNode: FunctionLike }): boolean => {
  // Check if this function is passed as an argument to a method call
  // e.g., .refine((x) => ...), .map((x) => ...), .filter((x) => ...)
  if (!funcNode.parent) {
    return false;
  }

  // If parent is a CallExpression, this function is being used as a callback
  if (funcNode.parent.type === 'CallExpression') {
    return true;
  }

  return false;
};

const checkParams = ({
  funcNode,
  context,
}: {
  funcNode: FunctionLike;
  context: Rule.RuleContext;
}): void => {
  if (funcNode.params.length === 0 || funcNode.params.length > 1) {
    return; // No params is fine, max-params rule will catch multiple params
  }

  const [firstParam] = funcNode.params;
  if (!firstParam) {
    return;
  }

  // Skip callback functions passed to library methods
  if (isCallbackFunction({ funcNode })) {
    return;
  }

  // Check if parameter uses object destructuring
  // Handle two cases:
  // 1. Direct ObjectPattern: ({ x }: { x: Type })
  // 2. AssignmentPattern with ObjectPattern left: ({ x = 5 } = {})
  const isObjectDestructuring =
    firstParam.type === 'ObjectPattern' ||
    (firstParam.type === 'AssignmentPattern' && firstParam.left?.type === 'ObjectPattern');

  if (!isObjectDestructuring) {
    context.report({
      node: firstParam,
      messageId: 'useObjectDestructuring',
    });
  }
};

export const enforceObjectDestructuringParamsRuleBroker = (): Rule.RuleModule => ({
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce object destructuring for function parameters',
    },
    messages: {
      useObjectDestructuring:
        'Function parameters must use object destructuring pattern: ({ param }: { param: Type })',
    },
    schema: [],
  },
  create: (context: Rule.RuleContext) => {
    let functionDepth = 0;

    return {
      ArrowFunctionExpression: (node): void => {
        functionDepth++;
        if (functionDepth === 1) {
          const arrowNode = node as FunctionLike;
          checkParams({ funcNode: arrowNode, context });
        }
      },
      'ArrowFunctionExpression:exit': (): void => {
        functionDepth--;
      },
      FunctionDeclaration: (node): void => {
        functionDepth++;
        if (functionDepth === 1) {
          const funcNode = node as FunctionLike;
          checkParams({ funcNode, context });
        }
      },
      'FunctionDeclaration:exit': (): void => {
        functionDepth--;
      },
      FunctionExpression: (node): void => {
        functionDepth++;
        if (functionDepth === 1) {
          const funcNode = node as FunctionLike;
          checkParams({ funcNode, context });
        }
      },
      'FunctionExpression:exit': (): void => {
        functionDepth--;
      },
    };
  },
});
