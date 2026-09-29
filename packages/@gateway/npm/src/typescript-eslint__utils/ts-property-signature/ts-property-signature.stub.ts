import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const TSPropertySignatureStub = ({
  code = 'type T = { a: string };',
}: { code?: string } = {}): TSESTree.TSPropertySignature =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.TSPropertySignature });
