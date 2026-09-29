import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';

export const SwitchCaseStub = ({
  code = 'switch (a) { case 1: }',
}: { code?: string } = {}): TSESTree.SwitchCase =>
  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.SwitchCase });
