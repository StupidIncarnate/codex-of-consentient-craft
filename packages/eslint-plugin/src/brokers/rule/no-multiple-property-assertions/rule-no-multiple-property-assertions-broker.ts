/**
 * PURPOSE: Creates ESLint rule that disallows multiple assertions on properties of the same root object
 *
 * USAGE:
 * const rule = ruleNoMultiplePropertyAssertionsBroker();
 * // Returns RuleModule that detects when 2+ properties of same object are tested separately in a test block
 *
 * WHEN-TO-USE: When registering ESLint rules to prevent property bleedthrough by enforcing complete object assertions
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';
import { astGetMemberExpressionRootTransformer } from '../../../transformers/ast-get-member-expression-root/ast-get-member-expression-root-transformer';
import { astFindExpectCallTransformer } from '../../../transformers/ast-find-expect-call/ast-find-expect-call-transformer';
import { identifierContract, type Identifier } from '@dungeonmaster/shared/contracts';

export const ruleNoMultiplePropertyAssertionsBroker =
  (): TSESLint.RuleModule<'multiplePropertyAssertions'> => ({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Disallow multiple assertions on properties of the same root object. Use a single toStrictEqual assertion on the complete object to prevent property bleedthrough.',
      },
      messages: {
        multiplePropertyAssertions:
          'Use single toStrictEqual on complete object instead of testing individual properties. Testing {{count}} properties of "{{rootObject}}" separately allows property bleedthrough - combine into: expect({{rootObject}}).toStrictEqual({...})',
      },
      schema: [],
    },
    defaultOptions: [],
    create: (context: TSESLint.RuleContext<string, unknown[]>) => {
      const ctx = context;
      const isTestFile = isTestFileGuard({ filename: ctx.filename });

      if (!isTestFile) {
        return {};
      }

      // Track assertions by it() block - map from it() node to array of [rootObject, node]
      const assertionsByItBlock = new Map<unknown, { rootObject: Identifier; node: unknown }[]>();
      let currentItBlock: unknown = null;

      return {
        // Track when we enter an it() or test() block
        'CallExpression[callee.name=/^(it|test)$/]': (node: TSESTree.CallExpression): void => {
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
          const byRootObject = new Map<Identifier, unknown[]>();
          for (const { rootObject, node } of assertions) {
            const existing = byRootObject.get(rootObject);
            if (existing === undefined) {
              byRootObject.set(rootObject, [node]);
            } else {
              existing.push(node);
            }
          }

          // Report violations where same root object has 2+ assertions
          const minAssertionsForViolation = 2;
          for (const [rootObject, nodes] of byRootObject.entries()) {
            if (nodes.length >= minAssertionsForViolation) {
              // Report on all assertions for this root object
              for (const node of nodes) {
                ctx.report({
                  node: node as TSESTree.Node,
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

        // Detect expect(obj.property).<anyMatcher>() pattern
        CallExpression: (node: TSESTree.CallExpression): void => {
          if (currentItBlock === null) {
            return;
          }

          // Walk the expect chain to find expect() call regardless of matcher
          const expectCall = astFindExpectCallTransformer({ node });
          if (expectCall === null) {
            return;
          }

          // Check if expect() argument is a member expression (obj.property)
          const [expectArg] = expectCall.arguments;
          const isMemberExpression = expectArg?.type === AST_NODE_TYPES.MemberExpression;

          if (!isMemberExpression) {
            return;
          }

          // Extract root object name
          const rootObject = astGetMemberExpressionRootTransformer({ expr: expectArg });
          if (rootObject === null) {
            return;
          }

          // Track this assertion
          const assertions = assertionsByItBlock.get(currentItBlock);
          if (assertions !== undefined) {
            assertions.push({ rootObject: identifierContract.parse(rootObject), node });
          }
        },
      };
    },
  });
