import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../parse-and-find-node/parse-and-find-node';

// jsx: true — the parser only accepts JSX syntax with this parser option on; parseAndFindNode's
// own `jsx` flag also carries the `.tsx` filePath the parser needs to disambiguate JSX from a
// comparison/generic.
export const JSXElementStub = ({
  code = 'const el = <div>hi</div>;',
}: { code?: string } = {}): TSESTree.JSXElement =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.JSXElement, jsx: true });
