import type { StubArgument } from '@dungeonmaster/shared/@types';

import { seedBindingsContract } from './seed-bindings-contract';
import type { SeedBindings } from './seed-bindings-contract';

export const SeedBindingsStub = ({ ...props }: StubArgument<SeedBindings> = {}): SeedBindings =>
  seedBindingsContract.parse({
    g: {
      guildId: '7306b468-0f2d-4a5e-9c3b-2d1e8f0a6b41',
      guildSlug: 'siege-guild',
      questId: 'bbbbbbbb-2222-4222-8222-222222222222',
    },
    ...props,
  });
