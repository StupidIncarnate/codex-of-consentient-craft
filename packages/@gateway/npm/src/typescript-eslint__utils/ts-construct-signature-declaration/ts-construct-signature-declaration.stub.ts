import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const TSConstructSignatureDeclarationStub = ({
  code = 'type T = { new (): T };',
}: { code?: string } = {}): TSESTree.TSConstructSignatureDeclaration =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.TSConstructSignatureDeclaration });
