import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const TSTypePredicateStub = ({
  code = 'function f(x): x is string {}',
}: { code?: string } = {}): TSESTree.TSTypePredicate =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.TSTypePredicate });
