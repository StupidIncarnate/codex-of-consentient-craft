import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const AssignmentPatternStub = ({
  code = 'const { a = 1 } = y;',
}: { code?: string } = {}): TSESTree.AssignmentPattern =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.AssignmentPattern });
