import { floorNumberContract } from './floor-number-contract';
import type { FloorNumber } from './floor-number-contract';

export const FloorNumberStub = ({ value }: { value?: number } = {}): FloorNumber =>
  floorNumberContract.parse(value ?? 1);
