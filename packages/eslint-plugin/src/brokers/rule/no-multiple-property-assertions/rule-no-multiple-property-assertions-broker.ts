import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';

const isMemberExpression = (node: Tsestree | null | undefined): node is Tsestree =>
  node !== null && node !== undefined && node.type === 'MemberExpression';

/**
 * Extracts the root object name from a member expression chain.
 * Examples:
 * - result.files => 'result'
 * - result.user.name => 'result'
 * - obj?.prop => 'obj'
 */
const getRootObjectName = (expr: Tsestree): string | null => {
  let current: Tsestree | null | undefined = expr;

  // Traverse up the member expression chain
  while (current !== null && current !== undefined && current.type === 'MemberExpression') {
    current = current.object;
  }

  // At the root, should be an Identifier
  if (
    current !== null &&
    current !== undefined &&
    current.type === 'Identifier' &&
    typeof current.name === 'string'
  ) {
    return current.name;
  }

  return null;
};

export const ruleNoMultiplePropertyAssertionsBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
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
  }),
  create: (context: unknown) => {
    const ctx = context as EslintContext;
    const isTestFile = isTestFileGuard({ filename: ctx.filename ?? '' });

    if (!isTestFile) {
      return {};
    }

    // Track assertions by it() block - map from it() node to array of [rootObject, node]
    const assertionsByItBlock = new Map<unknown, { rootObject: string; node: unknown }[]>();
    let currentItBlock: unknown = null;

    return {
      // Track when we enter an it() or test() block
      'CallExpression[callee.name=/^(it|test)$/]': (node: Tsestree): void => {
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
              ctx.report({
                node: node as Tsestree,
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
      CallExpression: (node: Tsestree): void => {
        if (currentItBlock === null) {
          return;
        }

        // Check if this is .toStrictEqual() call
        const isToStrictEqual =
          node.callee?.type === 'MemberExpression' &&
          node.callee.property?.name === 'toStrictEqual';

        if (!isToStrictEqual) {
          return;
        }

        // Check if the object is expect() call
        const expectCall = node.callee?.object;
        if (
          expectCall === null ||
          expectCall === undefined ||
          expectCall.type !== 'CallExpression'
        ) {
          return;
        }

        // Verify it's expect() function
        const isExpectCall =
          expectCall.callee?.type === 'Identifier' && expectCall.callee.name === 'expect';

        if (!isExpectCall) {
          return;
        }

        // Check if expect() argument is a member expression (obj.property)
        const expectArg = expectCall.arguments?.[0];
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
