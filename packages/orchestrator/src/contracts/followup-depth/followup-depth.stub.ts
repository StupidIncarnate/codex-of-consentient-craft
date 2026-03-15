import { followupDepthContract } from './followup-depth-contract';
import type { FollowupDepth } from './followup-depth-contract';

export const FollowupDepthStub = ({ value }: { value: number } = { value: 0 }): FollowupDepth =>
  followupDepthContract.parse(value);
