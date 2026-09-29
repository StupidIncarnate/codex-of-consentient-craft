import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const IfStatementStub = ({
  code = 'if (a) {}',
}: { code?: string } = {}): TSESTree.IfStatement =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.IfStatement });
