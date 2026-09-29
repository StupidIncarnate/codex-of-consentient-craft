import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const TSCallSignatureDeclarationStub = ({
  code = 'type T = { (): void };',
}: { code?: string } = {}): TSESTree.TSCallSignatureDeclaration =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.TSCallSignatureDeclaration });
