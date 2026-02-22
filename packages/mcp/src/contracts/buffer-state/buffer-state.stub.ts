import { bufferStateContract } from './buffer-state-contract';
import type { BufferState } from './buffer-state-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const BufferStateStub = ({ ...props }: StubArgument<BufferState> = {}): BufferState =>
  bufferStateContract.parse({
    value: '',
    ...props,
  });
