import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const UpdateExpressionStub = ({
  code = 'a++;',
}: { code?: string } = {}): TSESTree.UpdateExpression =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.UpdateExpression });
