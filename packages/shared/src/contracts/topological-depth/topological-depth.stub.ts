import { topologicalDepthContract } from './topological-depth-contract';
import type { TopologicalDepth } from './topological-depth-contract';

export const TopologicalDepthStub = (
  { value }: { value?: number } = { value: 0 },
): TopologicalDepth => topologicalDepthContract.parse(value ?? 0);
