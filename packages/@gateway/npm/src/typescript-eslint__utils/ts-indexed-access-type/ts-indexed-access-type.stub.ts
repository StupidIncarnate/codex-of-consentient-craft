import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const TSIndexedAccessTypeStub = ({
  code = 'let x: T["a"];',
}: { code?: string } = {}): TSESTree.TSIndexedAccessType =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.TSIndexedAccessType });
