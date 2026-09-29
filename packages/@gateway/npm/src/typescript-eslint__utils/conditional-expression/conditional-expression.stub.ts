import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const ConditionalExpressionStub = ({
  code = 'a ? b : c;',
}: { code?: string } = {}): TSESTree.ConditionalExpression =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.ConditionalExpression });
