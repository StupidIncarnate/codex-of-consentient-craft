import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const NewExpressionStub = ({
  code = 'new A();',
}: { code?: string } = {}): TSESTree.NewExpression =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.NewExpression });
