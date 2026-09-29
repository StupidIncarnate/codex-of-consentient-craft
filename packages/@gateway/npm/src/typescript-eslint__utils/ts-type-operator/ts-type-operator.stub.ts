import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const TSTypeOperatorStub = ({
  code = 'let x: readonly string[];',
}: { code?: string } = {}): TSESTree.TSTypeOperator =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.TSTypeOperator });
