import { scrollOffsetPxContract } from './scroll-offset-px-contract';
import type { ScrollOffsetPx } from './scroll-offset-px-contract';

export const ScrollOffsetPxStub = ({ value }: { value: number } = { value: 60 }): ScrollOffsetPx =>
  scrollOffsetPxContract.parse(value);
