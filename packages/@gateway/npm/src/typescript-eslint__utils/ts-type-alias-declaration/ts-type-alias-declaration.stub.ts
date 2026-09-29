import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const TSTypeAliasDeclarationStub = ({
  code = 'type T = { a: string };',
}: { code?: string } = {}): TSESTree.TSTypeAliasDeclaration =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.TSTypeAliasDeclaration });
