import type { StubArgument } from '@dungeonmaster/shared/@types';

import { commentAnchorContract } from './comment-anchor-contract';
import type { CommentAnchor } from './comment-anchor-contract';

export const CommentAnchorStub = ({ ...props }: StubArgument<CommentAnchor> = {}): CommentAnchor =>
  commentAnchorContract.parse({
    flowId: 'login-flow',
    nodeId: 'login-page',
    ...props,
  });
