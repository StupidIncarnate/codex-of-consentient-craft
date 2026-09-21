import { wardCheckTypeContract } from './ward-check-type-contract';
import type { WardCheckType } from './ward-check-type-contract';

export const WardCheckTypeStub = (
  { value }: { value: string } = { value: 'typecheck' },
): WardCheckType => wardCheckTypeContract.parse(value);
