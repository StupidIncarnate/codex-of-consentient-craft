import { loadAverageContract } from './load-average-contract';
import type { LoadAverage } from './load-average-contract';

export const LoadAverageStub = (
  { value }: { value: readonly [number, number, number] } = { value: [7.9, 6.2, 4.1] },
): LoadAverage => loadAverageContract.parse(value);
