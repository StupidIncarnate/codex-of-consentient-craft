import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const ExportDefaultDeclarationStub = ({
  code = 'export default a;',
}: { code?: string } = {}): TSESTree.ExportDefaultDeclaration =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.ExportDefaultDeclaration });
