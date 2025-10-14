import type { Rule } from '../../../adapters/eslint/eslint-rule-adapter';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';

interface MemberExpression {
  type: 'MemberExpression';
  object: {
    type?: string;
    name?: string;
    object?: unknown;
  };
  property: {
    name?: string;
  };
}

interface CallExpression {
  callee?: {
    type?: string;
    name?: string;
    object?: {
      type?: string;
      name?: string;
    };
    property?: {
      name?: string;
    };
  };
  arguments?: {
    type?: string;
    object?: unknown;
    property?: unknown;
  }[];
}

const isMemberExpression = (node: unknown): node is MemberExpression =>
  typeof node === 'object' && node !== null && 'type' in node && node.type === 'MemberExpression';

/**
 * Extracts the root object name from a member expression chain.
 * Examples:
 * - result.files => 'result'
 * - result.user.name => 'result'
 * - obj?.prop => 'obj'
 */
const getRootObjectName = (expr: MemberExpression): string | null => {
  let current: MemberExpression | { type?: string; name?: string } = expr;

  // Traverse up the member expression chain
  while (isMemberExpression(current)) {
    current = current.object;
  }

  // At the root, should be an Identifier
  if (
    typeof current === 'object' &&
    current !== null &&
    'type' in current &&
    current.type === 'Identifier' &&
    'name' in current &&
    typeof current.name === 'string'
  ) {
    return current.name;
  }

  return null;
};

export const noMultiplePropertyAssertionsRuleBroker = (): Rule.RuleModule => ({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow multiple toStrictEqual assertions on properties of the same root object. Use a single assertion on the complete object to prevent property bleedthrough.',
    },
    messages: {
      multiplePropertyAssertions:
        'Use single toStrictEqual on complete object instead of testing individual properties. Testing {{count}} properties of "{{rootObject}}" separately allows property bleedthrough - combine into: expect({{rootObject}}).toStrictEqual({...})',
    },
    schema: [],
  },
  create: (context: Rule.RuleContext) => {
    const isTestFile = isTestFileGuard({ filename: context.filename });

    if (!isTestFile) {
      return {};
    }

    // Track assertions by it() block - map from it() node to array of [rootObject, node]
    const assertionsByItBlock = new Map<unknown, { rootObject: string; node: unknown }[]>();
    let currentItBlock: unknown = null;

    return {
      // Track when we enter an it() or test() block
      'CallExpression[callee.name=/^(it|test)$/]': (node): void => {
        currentItBlock = node;
        assertionsByItBlock.set(currentItBlock, []);
      },

      // Track when we exit an it() block and check for violations
      'CallExpression[callee.name=/^(it|test)$/]:exit': (): void => {
        if (currentItBlock === null) {
          return;
        }

        const assertions = assertionsByItBlock.get(currentItBlock);
        if (assertions === undefined || assertions.length === 0) {
          currentItBlock = null;
          return;
        }

        // Group assertions by root object
        const byRootObject = new Map<string, unknown[]>();
        for (const { rootObject, node } of assertions) {
          const existing = byRootObject.get(rootObject);
          if (existing !== undefined) {
            existing.push(node);
          } else {
            byRootObject.set(rootObject, [node]);
          }
        }

        // Report violations where same root object has 2+ assertions
        for (const [rootObject, nodes] of byRootObject.entries()) {
          if (nodes.length >= 2) {
            // Report on all assertions for this root object
            for (const node of nodes) {
              context.report({
                node: node as Rule.Node,
                messageId: 'multiplePropertyAssertions',
                data: {
                  rootObject,
                  count: String(nodes.length),
                },
              });
            }
          }
        }

        currentItBlock = null;
      },

      // Detect expect(obj.property).toStrictEqual() pattern
      CallExpression: (node): void => {
        if (currentItBlock === null) {
          return;
        }

        const callNode = node as unknown as CallExpression;

        // Check if this is .toStrictEqual() call
        const isToStrictEqual =
          callNode.callee?.type === 'MemberExpression' &&
          callNode.callee.property?.name === 'toStrictEqual';

        if (!isToStrictEqual) {
          return;
        }

        // Check if the object is expect() call
        const expectCall = callNode.callee?.object;
        if (
          typeof expectCall !== 'object' ||
          expectCall === null ||
          !('type' in expectCall) ||
          expectCall.type !== 'CallExpression'
        ) {
          return;
        }

        const expectCallNode = expectCall as CallExpression;

        // Verify it's expect() function
        const isExpectCall =
          expectCallNode.callee?.type === 'Identifier' && expectCallNode.callee.name === 'expect';

        if (!isExpectCall) {
          return;
        }

        // Check if expect() argument is a member expression (obj.property)
        const expectArg = expectCallNode.arguments?.[0];
        if (!isMemberExpression(expectArg)) {
          return;
        }

        // Extract root object name
        const rootObject = getRootObjectName(expectArg);
        if (rootObject === null) {
          return;
        }

        // Track this assertion
        const assertions = assertionsByItBlock.get(currentItBlock);
        if (assertions !== undefined) {
          assertions.push({ rootObject, node });
        }
      },
    };
  },
});
