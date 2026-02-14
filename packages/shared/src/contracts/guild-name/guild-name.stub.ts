import { guildNameContract } from './guild-name-contract';
import type { GuildName } from './guild-name-contract';

export const GuildNameStub = ({ value }: { value: string } = { value: 'My Guild' }): GuildName =>
  guildNameContract.parse(value);
