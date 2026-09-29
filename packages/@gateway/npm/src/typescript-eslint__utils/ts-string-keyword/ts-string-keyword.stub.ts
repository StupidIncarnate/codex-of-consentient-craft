import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const TSStringKeywordStub = ({
  code = 'let x: string;',
}: { code?: string } = {}): TSESTree.TSStringKeyword =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.TSStringKeyword });
