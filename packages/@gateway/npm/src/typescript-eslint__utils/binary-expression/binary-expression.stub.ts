import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const BinaryExpressionStub = ({
  code = 'a + b;',
}: { code?: string } = {}): TSESTree.BinaryExpression =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.BinaryExpression });
