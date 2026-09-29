import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const TSUnionTypeStub = ({
  code = 'let x: A | B;',
}: { code?: string } = {}): TSESTree.TSUnionType =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.TSUnionType });
