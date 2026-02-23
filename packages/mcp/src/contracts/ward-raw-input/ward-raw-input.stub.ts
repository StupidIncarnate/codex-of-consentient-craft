import { wardRawInputContract } from './ward-raw-input-contract';
import type { WardRawInput } from './ward-raw-input-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const WardRawInputStub = ({ ...props }: StubArgument<WardRawInput> = {}): WardRawInput =>
  wardRawInputContract.parse({
    runId: '1739625600000-a3f1',
    checkType: 'lint',
    ...props,
  });
