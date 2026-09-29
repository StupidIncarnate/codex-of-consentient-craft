import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const TemplateLiteralStub = ({
  code = 'const t = `a`;',
}: { code?: string } = {}): TSESTree.TemplateLiteral =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.TemplateLiteral });
