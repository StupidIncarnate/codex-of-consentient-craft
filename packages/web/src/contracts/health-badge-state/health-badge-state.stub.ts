import type { StubArgument } from '@dungeonmaster/shared/@types';

import { healthBadgeStateContract } from './health-badge-state-contract';
import type { HealthBadgeState } from './health-badge-state-contract';

// Defaults to the 'checking' branch. Pass a full override — e.g.
// HealthBadgeStateStub({ state: 'online', uptimeSeconds: 11520 }) — to get one of the other
// three branches; the discriminated union parse strips the now-irrelevant default fields.
export const HealthBadgeStateStub = ({
  ...props
}: StubArgument<HealthBadgeState> = {}): HealthBadgeState =>
  healthBadgeStateContract.parse({
    state: 'checking',
    ...props,
  });
