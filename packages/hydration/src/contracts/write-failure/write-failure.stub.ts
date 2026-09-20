import type { StubArgument } from '@dungeonmaster/shared/@types';
import { writeFailureContract } from './write-failure-contract';
import type { WriteFailure } from './write-failure-contract';

export const WriteFailureStub = ({ ...props }: StubArgument<WriteFailure> = {}): WriteFailure =>
  writeFailureContract.parse({
    path: null,
    ...props,
  });
