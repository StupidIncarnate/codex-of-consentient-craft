import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../parse-and-find-node/parse-and-find-node';

export const ProgramStub = ({ code = 'const a = 1;' }: { code?: string } = {}): TSESTree.Program =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.Program });
