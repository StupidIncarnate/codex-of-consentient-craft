import { floorNameContract } from './floor-name-contract';
import type { FloorName } from './floor-name-contract';

export const FloorNameStub = ({ value }: { value?: string } = {}): FloorName =>
  floorNameContract.parse(value ?? 'CARTOGRAPHY');
