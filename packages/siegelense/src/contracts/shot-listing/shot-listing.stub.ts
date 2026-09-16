import type { StubArgument } from '@dungeonmaster/shared/@types';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { PixelChangeStub } from '../pixel-change/pixel-change.stub';
import { ShotOpenReasonStub } from '../shot-open-reason/shot-open-reason.stub';
import { StepIndexStub } from '../step-index/step-index.stub';
import { shotListingContract } from './shot-listing-contract';
import type { ShotListing } from './shot-listing-contract';

export const ShotListingStub = ({ ...props }: StubArgument<ShotListing> = {}): ShotListing =>
  shotListingContract.parse({
    step: StepIndexStub({ value: 1 }),
    path: AbsoluteFilePathStub({
      value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step1.png',
    }),
    open: true,
    why: ShotOpenReasonStub({ value: 'start' }),
    node: null,
    pixelChange: PixelChangeStub(),
    blank: false,
    blankColour: null,
    ...props,
  });
