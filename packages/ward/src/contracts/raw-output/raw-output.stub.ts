import type { StubArgument } from '@dungeonmaster/shared/@types';
import { rawOutputContract, type RawOutput } from './raw-output-contract';

export const RawOutputStub = ({ ...props }: StubArgument<RawOutput> = {}): RawOutput =>
  rawOutputContract.parse({
    stdout: '',
    stderr: '',
    exitCode: 0,
    ...props,
  });
