import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const JSXTextStub = ({
  code = 'const j = <a>t</a>;',
}: { code?: string } = {}): TSESTree.JSXText =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.JSXText, jsx: true });
