import type { StubArgument } from '@dungeonmaster/shared/@types';
import { durationSampleContract } from './duration-sample-contract';
import type { DurationSample } from './duration-sample-contract';

export const DurationSampleStub = ({
  ...props
}: StubArgument<DurationSample> = {}): DurationSample =>
  durationSampleContract.parse({
    repoRoot: '/home/user/project',
    packageName: 'ward',
    checkType: 'unit',
    durationMs: 1200,
    peakRssMB: null,
    shards: null,
    recordedAtMs: 1700000000000,
    ...props,
  });
