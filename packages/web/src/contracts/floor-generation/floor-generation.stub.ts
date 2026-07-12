import { floorGenerationContract } from './floor-generation-contract';
import type { FloorGeneration } from './floor-generation-contract';

export const FloorGenerationStub = ({ value }: { value?: number } = {}): FloorGeneration =>
  floorGenerationContract.parse(value ?? 0);
