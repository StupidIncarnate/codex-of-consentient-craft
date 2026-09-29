import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const TSVoidKeywordStub = ({
  code = 'let x: void;',
}: { code?: string } = {}): TSESTree.TSVoidKeyword =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.TSVoidKeyword });
