import { scrollThresholdPxContract } from './scroll-threshold-px-contract';
import type { ScrollThresholdPx } from './scroll-threshold-px-contract';

export const ScrollThresholdPxStub = ({ value }: { value?: number } = {}): ScrollThresholdPx =>
  scrollThresholdPxContract.parse(value ?? 10);
