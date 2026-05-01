/**
 * PURPOSE: Stub factory for FsWatchTailCall contract
 *
 * USAGE:
 * const call = FsWatchTailCallStub({ filePathArg: '/repo/.dungeonmaster/quests/quest.jsonl' });
 * // Returns a validated FsWatchTailCall with sensible defaults
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import { fsWatchTailCallContract, type FsWatchTailCall } from './fs-watch-tail-call-contract';

export const FsWatchTailCallStub = ({
  ...props
}: StubArgument<FsWatchTailCall> = {}): FsWatchTailCall =>
  fsWatchTailCallContract.parse({
    filePathArg: '/repo/.dungeonmaster/quests/quest.jsonl',
    ...props,
  });
