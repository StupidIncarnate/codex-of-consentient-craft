import type { StubArgument } from '@dungeonmaster/shared/@types';

import { ShotOpenReasonStub } from '../shot-open-reason/shot-open-reason.stub';
import { shotListingContract } from './shot-listing-contract';
import type { ShotListing } from './shot-listing-contract';

export const ShotListingStub = ({ ...props }: StubArgument<ShotListing> = {}): ShotListing =>
  shotListingContract.parse({
    step: 1,
    path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_2/step1.png',
    open: true,
    why: ShotOpenReasonStub({ value: 'start' }),
    node: null,
    pixelChange: '38%',
    blank: false,
    blankColour: null,
    ...props,
  });
