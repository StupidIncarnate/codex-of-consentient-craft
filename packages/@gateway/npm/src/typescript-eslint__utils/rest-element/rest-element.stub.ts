import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const RestElementStub = ({
  code = 'const [...a] = y;',
}: { code?: string } = {}): TSESTree.RestElement =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.RestElement });
