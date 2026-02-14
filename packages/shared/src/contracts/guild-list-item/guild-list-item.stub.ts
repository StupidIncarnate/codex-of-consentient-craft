import type { StubArgument } from '@dungeonmaster/shared/@types';

import { guildListItemContract } from './guild-list-item-contract';
import type { GuildListItem } from './guild-list-item-contract';

export const GuildListItemStub = ({ ...props }: StubArgument<GuildListItem> = {}): GuildListItem =>
  guildListItemContract.parse({
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'My Guild',
    path: '/home/user/my-guild',
    createdAt: '2024-01-15T10:00:00.000Z',
    valid: true,
    questCount: 0,
    ...props,
  });
