import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const ExportSpecifierStub = ({
  code = 'export { a };',
}: { code?: string } = {}): TSESTree.ExportSpecifier =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.ExportSpecifier });
