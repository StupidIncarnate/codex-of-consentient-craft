import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const ImportExpressionStub = ({
  code = "import('x');",
}: { code?: string } = {}): TSESTree.ImportExpression =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.ImportExpression });
