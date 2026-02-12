import { bufferCursorIndexContract } from './buffer-cursor-index-contract';
import type { BufferCursorIndex } from './buffer-cursor-index-contract';

export const BufferCursorIndexStub = ({ value }: { value?: number } = {}): BufferCursorIndex =>
  bufferCursorIndexContract.parse(value ?? 0);
