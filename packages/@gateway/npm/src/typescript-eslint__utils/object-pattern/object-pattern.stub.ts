import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const ObjectPatternStub = ({
  code = 'const { a } = y;',
}: { code?: string } = {}): TSESTree.ObjectPattern =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.ObjectPattern });
