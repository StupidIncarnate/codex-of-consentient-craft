import type { StubArgument } from '@dungeonmaster/shared/@types';

import { commentStaleAnchorContract } from './comment-stale-anchor-contract';
import type { CommentStaleAnchor } from './comment-stale-anchor-contract';

export const CommentStaleAnchorStub = ({
  ...props
}: StubArgument<CommentStaleAnchor> = {}): CommentStaleAnchor =>
  commentStaleAnchorContract.parse({
    flowId: 'login-flow',
    nodeId: 'start',
    ...props,
  });
