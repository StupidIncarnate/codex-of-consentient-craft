import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const LiteralStub = ({ code = 'const a = 1;' }: { code?: string } = {}): TSESTree.Literal =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.Literal });
