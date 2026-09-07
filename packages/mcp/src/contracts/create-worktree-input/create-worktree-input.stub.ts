import type { StubArgument } from '@dungeonmaster/shared/@types';

import { createWorktreeInputContract } from './create-worktree-input-contract';
import type { CreateWorktreeInput } from './create-worktree-input-contract';

export const CreateWorktreeInputStub = ({
  ...props
}: StubArgument<CreateWorktreeInput> = {}): CreateWorktreeInput =>
  createWorktreeInputContract.parse({
    name: 'probe',
    ...props,
  });
