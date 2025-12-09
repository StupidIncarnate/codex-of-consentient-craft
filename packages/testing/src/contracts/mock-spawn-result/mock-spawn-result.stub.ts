import type { StubArgument } from '@dungeonmaster/shared/@types';
import { mockSpawnResultContract } from './mock-spawn-result-contract';
import type { MockSpawnResult } from './mock-spawn-result-contract';

export const MockSpawnResultStub = ({
  ...props
}: StubArgument<MockSpawnResult> = {}): MockSpawnResult =>
  mockSpawnResultContract.parse({
    code: 0,
    stdout: '',
    stderr: '',
    ...props,
  });
