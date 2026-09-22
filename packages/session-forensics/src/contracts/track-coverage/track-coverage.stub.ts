import { trackCoverageContract, type TrackCoverage } from './track-coverage-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const TrackCoverageStub = ({ ...props }: StubArgument<TrackCoverage> = {}): TrackCoverage =>
  trackCoverageContract.parse({
    flowId: 'paste-image-into-composer',
    track: 'codeweaver',
    owed: 58,
    signed: 58,
    met: 55,
    cantMeet: 3,
    unmet: 0,
    unsigned: 0,
    ...props,
  });
