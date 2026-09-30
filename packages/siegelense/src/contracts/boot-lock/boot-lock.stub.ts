import type { StubArgument } from '@dungeonmaster/shared/@types';

import { InstanceIdStub } from '../instance-id/instance-id.stub';
import { bootLockContract } from './boot-lock-contract';
import type { BootLock } from './boot-lock-contract';

export const BootLockStub = ({ ...props }: StubArgument<BootLock> = {}): BootLock =>
  bootLockContract.parse({
    heldBy: InstanceIdStub(),
    heldByPid: 'proc-12345',
    acquiredAtMs: 1,
    ...props,
  });
