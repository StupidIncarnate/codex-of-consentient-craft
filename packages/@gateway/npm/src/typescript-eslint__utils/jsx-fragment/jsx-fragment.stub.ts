import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../parse-and-find-node/parse-and-find-node';

export const JSXFragmentStub = ({
  code = 'const el = <>hi</>;',
}: { code?: string } = {}): TSESTree.JSXFragment =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.JSXFragment, jsx: true });
