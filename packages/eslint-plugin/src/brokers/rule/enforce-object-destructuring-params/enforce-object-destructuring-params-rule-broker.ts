import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

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
  context: EslintContext;
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

export const enforceObjectDestructuringParamsRuleBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
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
  }),
  create: (context: unknown) => {
    const ctx = context as EslintContext;
    let functionDepth = 0;

    return {
      ArrowFunctionExpression: (node: Tsestree): void => {
        functionDepth++;
        if (functionDepth === 1) {
          const arrowNode = node as unknown as FunctionLike;
          checkParams({ funcNode: arrowNode, context: ctx });
        }
      },
      'ArrowFunctionExpression:exit': (): void => {
        functionDepth--;
      },
      FunctionDeclaration: (node: Tsestree): void => {
        functionDepth++;
        if (functionDepth === 1) {
          const funcNode = node as unknown as FunctionLike;
          checkParams({ funcNode, context: ctx });
        }
      },
      'FunctionDeclaration:exit': (): void => {
        functionDepth--;
      },
      FunctionExpression: (node: Tsestree): void => {
        functionDepth++;
        if (functionDepth === 1) {
          const funcNode = node as unknown as FunctionLike;
          checkParams({ funcNode, context: ctx });
        }
      },
      'FunctionExpression:exit': (): void => {
        functionDepth--;
      },
    };
  },
});
