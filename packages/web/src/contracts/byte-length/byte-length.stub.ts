import { byteLengthContract } from './byte-length-contract';
import type { ByteLength } from './byte-length-contract';

export const ByteLengthStub = ({ value }: { value?: number } = {}): ByteLength =>
  byteLengthContract.parse(value ?? 1024);
