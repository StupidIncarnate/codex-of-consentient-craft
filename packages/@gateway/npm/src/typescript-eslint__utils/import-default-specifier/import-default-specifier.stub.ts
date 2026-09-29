import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const ImportDefaultSpecifierStub = ({
  code = "import a from 'x';",
}: { code?: string } = {}): TSESTree.ImportDefaultSpecifier =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.ImportDefaultSpecifier });
