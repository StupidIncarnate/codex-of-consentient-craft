import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const TSBooleanKeywordStub = ({
  code = 'let x: boolean;',
}: { code?: string } = {}): TSESTree.TSBooleanKeyword =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.TSBooleanKeyword });
