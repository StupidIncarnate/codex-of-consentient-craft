import type { Guild } from '../guild/guild-contract';
import { guildContract } from '../guild/guild-contract';

const guildIdContract = guildContract.shape.id;

export const GuildIdStub = (
  { value }: { value: string } = { value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
): Guild['id'] => guildIdContract.parse(value);
