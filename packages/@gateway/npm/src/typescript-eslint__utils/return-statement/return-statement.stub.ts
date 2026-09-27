import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../parse-and-find-node/parse-and-find-node';

export const ReturnStatementStub = ({
  code = 'function foo() { return 1; }',
}: { code?: string } = {}): TSESTree.ReturnStatement =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.ReturnStatement });
