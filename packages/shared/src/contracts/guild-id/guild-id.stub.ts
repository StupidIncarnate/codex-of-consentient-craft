import { guildIdContract } from './guild-id-contract';
import type { GuildId } from './guild-id-contract';

export const GuildIdStub = (
  { value }: { value: string } = { value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
): GuildId => guildIdContract.parse(value);
