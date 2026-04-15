import { pathSegmentContract } from './path-segment-contract';
import type { PathSegment } from './path-segment-contract';

export const PathSegmentStub = (
  {
    value,
  }: {
    value: string;
  } = {
    value: 'src/guards/is-thing-guard.ts',
  },
): PathSegment => pathSegmentContract.parse(value);
