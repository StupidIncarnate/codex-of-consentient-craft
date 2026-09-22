import type { StubArgument } from '@dungeonmaster/shared/@types';

import { seedResultContract } from './seed-result-contract';
import type { SeedResult } from './seed-result-contract';

// Shaped like `guild-empty`'s own real output — a `dmRegistryBroker.run` plan saves the FULL row
// under `saveRecordAs`'s name, never a flattened id (see recipes-guild-empty-broker.integration.test.ts).
export const SeedResultStub = ({ ...props }: StubArgument<SeedResult> = {}): SeedResult =>
  seedResultContract.parse({
    guild: {
      id: '7306b468-0f2d-4a5e-9c3b-2d1e8f0a6b41',
      name: 'Siege Guild',
      path: '/tmp/dm-siege-inst_seed/siege-repo',
      urlSlug: 'siege-guild',
      createdAt: '2024-01-15T10:00:00.000Z',
    },
    ...props,
  });
