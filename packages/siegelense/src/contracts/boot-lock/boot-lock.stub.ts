import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ProcessIdStub } from '@dungeonmaster/shared/contracts/process-id/process-id.stub';

import { InstanceIdStub } from '../instance-id/instance-id.stub';
import { bootLockContract } from './boot-lock-contract';
import type { BootLock } from './boot-lock-contract';

export const BootLockStub = ({ ...props }: StubArgument<BootLock> = {}): BootLock =>
  bootLockContract.parse({
    heldBy: InstanceIdStub(),
    heldByPid: ProcessIdStub(),
    acquiredAtMs: 1,
    ...props,
  });
