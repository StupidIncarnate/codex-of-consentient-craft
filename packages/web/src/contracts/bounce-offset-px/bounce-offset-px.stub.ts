import { bounceOffsetPxContract } from './bounce-offset-px-contract';
import type { BounceOffsetPx } from './bounce-offset-px-contract';

export const BounceOffsetPxStub = ({ value }: { value?: number } = {}): BounceOffsetPx =>
  bounceOffsetPxContract.parse(value ?? 0);
