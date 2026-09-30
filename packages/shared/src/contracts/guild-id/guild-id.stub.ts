import type { Guild } from '../guild/guild-contract';
import { guildContract } from '../guild/guild-contract';

export const GuildIdStub = (
  { value }: { value: string } = { value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
): Guild['id'] => guildContract.shape.id.parse(value);
