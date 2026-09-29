import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const AwaitExpressionStub = ({
  code = 'async function f() { await a; }',
}: { code?: string } = {}): TSESTree.AwaitExpression =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.AwaitExpression });
