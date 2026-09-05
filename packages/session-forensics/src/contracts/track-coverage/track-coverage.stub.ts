import { trackCoverageContract, type TrackCoverage } from './track-coverage-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const TrackCoverageStub = ({ ...props }: StubArgument<TrackCoverage> = {}): TrackCoverage =>
  trackCoverageContract.parse({
    flowId: 'paste-image-into-composer',
    track: 'codeweaverSignoff',
    owed: 58,
    signed: 58,
    confirmed: 55,
    unconfirmable: 3,
    unsigned: 0,
    ...props,
  });
