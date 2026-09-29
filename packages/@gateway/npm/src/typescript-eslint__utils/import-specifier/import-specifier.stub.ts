import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const ImportSpecifierStub = ({
  code = "import { a } from 'x';",
}: { code?: string } = {}): TSESTree.ImportSpecifier =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.ImportSpecifier });
