import type { StubArgument } from '@dungeonmaster/shared/@types';

import { riftcarverDetailContract } from './riftcarver-detail-contract';
import type { RiftcarverDetail } from './riftcarver-detail-contract';

export const RiftcarverDetailStub = ({
  ...props
}: StubArgument<RiftcarverDetail> = {}): RiftcarverDetail =>
  riftcarverDetailContract.parse({
    log: '— git worktree add —\ncreated worktree at /repo/worktrees/quest-abc12345\n\n— npm install —\nmirrored node_modules for 3 roots\n\n— build pass 1 —\nbuild succeeded\n',
    ...props,
  });
