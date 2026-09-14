import { pastedImageOrdinalContract } from './pasted-image-ordinal-contract';
import type { PastedImageOrdinal } from './pasted-image-ordinal-contract';

export const PastedImageOrdinalStub = ({ value }: { value?: number } = {}): PastedImageOrdinal =>
  pastedImageOrdinalContract.parse(value ?? 1);
