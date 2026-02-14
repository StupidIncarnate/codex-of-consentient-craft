import { guildPathContract } from './guild-path-contract';
import type { GuildPath } from './guild-path-contract';

export const GuildPathStub = (
  { value }: { value: string } = { value: '/home/user/my-guild' },
): GuildPath => guildPathContract.parse(value);
