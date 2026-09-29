import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const TSTypeReferenceStub = ({
  code = 'let x: T;',
}: { code?: string } = {}): TSESTree.TSTypeReference =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.TSTypeReference });
