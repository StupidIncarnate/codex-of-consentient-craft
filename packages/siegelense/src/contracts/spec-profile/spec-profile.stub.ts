import type { StubArgument } from '@dungeonmaster/shared/@types';

import { specProfileContract } from './spec-profile-contract';
import type { SpecProfile } from './spec-profile-contract';

export const SpecProfileStub = ({ ...props }: StubArgument<SpecProfile> = {}): SpecProfile =>
  specProfileContract.parse({
    specName: 'dungeonmaster-stack',
    processes: 3,
    hash: 'a3f9c2e1',
    measuredAt: '2026-09-14',
    fromRuns: 14,
    bootMs: 20_000,
    samples: [
      { poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 },
      { poolSize: 3, steadyMB: 1920, peakMB: 2810, runs: 5 },
    ],
    ...props,
  });
