import type { StubArgument } from '@dungeonmaster/shared/@types';

import { guildContract } from './guild-contract';
import type { Guild } from './guild-contract';

export const GuildStub = ({ ...props }: StubArgument<Guild> = {}): Guild =>
  guildContract.parse({
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'My Guild',
    path: '/home/user/my-guild',
    urlSlug: 'my-guild',
    createdAt: '2024-01-15T10:00:00.000Z',
    ...props,
  });
