import type { StubArgument } from '@dungeonmaster/shared/@types';

import { LaneProcessStub } from '../lane-process/lane-process.stub';
import { laneSpecContract } from './lane-spec-contract';
import type { LaneSpec } from './lane-spec-contract';

export const LaneSpecStub = ({ ...props }: StubArgument<LaneSpec> = {}): LaneSpec =>
  laneSpecContract.parse({
    name: 'dungeonmaster-headless',
    processes: [LaneProcessStub()],
    browser: false,
    bootTimeoutMs: 180_000,
    env: { DUNGEONMASTER_PORT: '{apiPort}' },
    ...props,
  });
