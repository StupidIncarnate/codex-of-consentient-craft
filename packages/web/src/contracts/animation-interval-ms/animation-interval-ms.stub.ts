import { animationIntervalMsContract } from './animation-interval-ms-contract';
import type { AnimationIntervalMs } from './animation-interval-ms-contract';

export const AnimationIntervalMsStub = ({ value }: { value?: number } = {}): AnimationIntervalMs =>
  animationIntervalMsContract.parse(value ?? 2000);
