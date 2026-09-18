import type { StubArgument } from '@dungeonmaster/shared/@types';

import { resetUndidContract } from './reset-undid-contract';
import type { ResetUndid } from './reset-undid-contract';
import { ReadingCountStub } from '../reading-count/reading-count.stub';

export const ResetUndidStub = ({ ...props }: StubArgument<ResetUndid> = {}): ResetUndid =>
  resetUndidContract.parse({
    files: ReadingCountStub({ value: 0 }),
    added: ReadingCountStub({ value: 0 }),
    modified: ReadingCountStub({ value: 0 }),
    removed: ReadingCountStub({ value: 0 }),
    ...props,
  });
