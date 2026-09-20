import type { StubArgument } from '@dungeonmaster/shared/@types';

import { seedResultContract } from './seed-result-contract';
import type { SeedResult } from './seed-result-contract';

export const SeedResultStub = ({ ...props }: StubArgument<SeedResult> = {}): SeedResult =>
  seedResultContract.parse({
    guildId: '7306b468-0f2d-4a5e-9c3b-2d1e8f0a6b41',
    guildSlug: 'siege-guild',
    questId: 'bbbbbbbb-2222-4222-8222-222222222222',
    ...props,
  });
