import type { StubArgument } from '@dungeonmaster/shared/@types';

import { holdReadingContract } from './hold-reading-contract';
import type { HoldReading } from './hold-reading-contract';
import { holdStatics } from '../../statics/hold/hold-statics';

export const HoldReadingStub = ({ ...props }: StubArgument<HoldReading> = {}): HoldReading => {
  const data: Record<PropertyKey, unknown> = {
    frames: holdStatics.defaults.frames,
    differing: 0,
    verdict: 'NOTHING CHANGED across 4.5s',
    shots: [
      '/repo/.dungeonmaster-assets/siegelense-assets/runs/run_1/step1_frame1.png',
      '/repo/.dungeonmaster-assets/siegelense-assets/runs/run_1/step1_frame2.png',
    ],
    ...props,
  };
  return holdReadingContract.parse(data);
};
