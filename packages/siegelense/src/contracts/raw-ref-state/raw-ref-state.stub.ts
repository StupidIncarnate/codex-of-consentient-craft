import { rawRefStateContract } from './raw-ref-state-contract';
import type { RawRefState } from './raw-ref-state-contract';

export const RawRefStateStub = ({ value }: { value: string } = { value: 'live' }): RawRefState =>
  rawRefStateContract.parse(value);
