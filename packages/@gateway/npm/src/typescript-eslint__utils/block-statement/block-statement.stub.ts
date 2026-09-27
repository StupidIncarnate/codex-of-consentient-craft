import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../parse-and-find-node/parse-and-find-node';

export const BlockStatementStub = ({
  code = 'function foo() {}',
}: { code?: string } = {}): TSESTree.BlockStatement =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.BlockStatement });
