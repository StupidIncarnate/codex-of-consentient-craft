import type { StubArgument } from '@dungeonmaster/shared/@types';

import { bufferLengthsContract } from './buffer-lengths-contract';
import type { BufferLengths } from './buffer-lengths-contract';

export const BufferLengthsStub = ({ ...props }: StubArgument<BufferLengths> = {}): BufferLengths =>
  bufferLengthsContract.parse({
    consoleLines: 0,
    networkLines: 0,
    websocketLines: 0,
    ...props,
  });
