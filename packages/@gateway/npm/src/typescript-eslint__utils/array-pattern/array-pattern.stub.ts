import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const ArrayPatternStub = ({
  code = 'const [a] = y;',
}: { code?: string } = {}): TSESTree.ArrayPattern =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.ArrayPattern });
