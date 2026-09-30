/**
 * PURPOSE: Builds a valid BootLockAcquireResult for tests
 *
 * USAGE:
 * BootLockAcquireResultStub();
 * // Returns a valid BootLockAcquireResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { BootLockStub } from '../boot-lock/boot-lock.stub';

import { bootLockAcquireResultContract } from './boot-lock-acquire-result-contract';
import type { BootLockAcquireResult } from './boot-lock-acquire-result-contract';

export const BootLockAcquireResultStub = ({
  ...props
}: StubArgument<BootLockAcquireResult> = {}): BootLockAcquireResult =>
  bootLockAcquireResultContract.parse({ lock: BootLockStub(), tookOverStale: false, ...props });
