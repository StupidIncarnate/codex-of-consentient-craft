import { bufferLineCountContract } from './buffer-line-count-contract';
import type { BufferLineCount } from './buffer-line-count-contract';

export const BufferLineCountStub = ({ value }: { value: number } = { value: 0 }): BufferLineCount =>
  bufferLineCountContract.parse(value);
