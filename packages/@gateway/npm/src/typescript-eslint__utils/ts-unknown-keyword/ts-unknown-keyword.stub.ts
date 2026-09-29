import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const TSUnknownKeywordStub = ({
  code = 'let x: unknown;',
}: { code?: string } = {}): TSESTree.TSUnknownKeyword =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.TSUnknownKeyword });
