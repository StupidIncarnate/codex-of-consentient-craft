import { floorGroupKeyContract } from './floor-group-key-contract';
import type { FloorGroupKey } from './floor-group-key-contract';

export const FloorGroupKeyStub = (
  { value }: { value?: string } = { value: '0:FORGE' },
): FloorGroupKey => floorGroupKeyContract.parse(value ?? '0:FORGE');
