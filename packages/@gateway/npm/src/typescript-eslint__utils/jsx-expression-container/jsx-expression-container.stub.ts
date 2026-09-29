import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const JSXExpressionContainerStub = ({
  code = 'const j = <a>{b}</a>;',
}: { code?: string } = {}): TSESTree.JSXExpressionContainer =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.JSXExpressionContainer, jsx: true });
