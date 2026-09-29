import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const TSInterfaceBodyStub = ({
  code = 'interface I { a: string }',
}: { code?: string } = {}): TSESTree.TSInterfaceBody =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.TSInterfaceBody });
