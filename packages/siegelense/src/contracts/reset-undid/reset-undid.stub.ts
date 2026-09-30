import type { StubArgument } from '@dungeonmaster/shared/@types';

import { resetUndidContract } from './reset-undid-contract';
import type { ResetUndid } from './reset-undid-contract';

export const ResetUndidStub = ({ ...props }: StubArgument<ResetUndid> = {}): ResetUndid =>
  resetUndidContract.parse({
    files: 0,
    added: 0,
    modified: 0,
    removed: 0,
    ...props,
  });
