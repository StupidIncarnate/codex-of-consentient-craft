import { scrollPositionPxContract } from './scroll-position-px-contract';
import type { ScrollPositionPx } from './scroll-position-px-contract';

export const ScrollPositionPxStub = ({ value }: { value?: number } = {}): ScrollPositionPx =>
  scrollPositionPxContract.parse(value ?? 0);
