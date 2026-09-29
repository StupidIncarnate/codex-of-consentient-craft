import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const TSMethodSignatureStub = ({
  code = 'type T = { m(): void };',
}: { code?: string } = {}): TSESTree.TSMethodSignature =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.TSMethodSignature });
