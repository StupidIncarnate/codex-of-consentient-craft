/**
 * PURPOSE: Stub factory for TailFileCall contract
 *
 * USAGE:
 * const call = TailFileCallStub({ filePathArg: '/repo/.dungeonmaster/quests/quest.jsonl' });
 * // Returns a validated TailFileCall with sensible defaults
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import { tailFileCallContract, type TailFileCall } from './tail-file-call-contract';

export const TailFileCallStub = ({ ...props }: StubArgument<TailFileCall> = {}): TailFileCall =>
  tailFileCallContract.parse({
    filePathArg: '/repo/.dungeonmaster/quests/quest.jsonl',
    ...props,
  });
