import { astNodeContract } from './ast-node-contract';
import type { AstNode } from './ast-node-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const AstNodeStub = ({ ...props }: StubArgument<AstNode> = {}): AstNode =>
  astNodeContract.parse({
    type: 'Identifier',
    range: [0, 10],
    loc: {
      start: { line: 1, column: 0 },
      end: { line: 1, column: 10 },
    },
    ...props,
  });
