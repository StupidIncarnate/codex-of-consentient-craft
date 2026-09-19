/**
 * PURPOSE: Builds a valid `DmTarget` for a test that needs one but does not care which temp
 * directory it points at. Defaults to no `baseUrl` and no `request`, so the stub can only run
 * ingredients declaring a `write` route — pass both to exercise an `api` route.
 *
 * USAGE:
 * DmTargetStub({ home: '/tmp/guild-1', claudeHome: '/tmp/guild-1' });
 * // Returns a DmTarget
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { dmTargetContract } from './dm-target-contract';
import type { DmTarget } from './dm-target-contract';

export const DmTargetStub = ({ ...props }: StubArgument<DmTarget> = {}): DmTarget =>
  dmTargetContract.parse({
    home: '/tmp/dm-target-stub',
    claudeHome: '/tmp/dm-target-stub',
    ...props,
  });
