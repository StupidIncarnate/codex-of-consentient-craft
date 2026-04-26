import { guildPathCwdContract, type GuildPathCwd } from './guild-path-cwd-contract';

export const GuildPathCwdStub = ({ value }: { value: unknown }): GuildPathCwd =>
  guildPathCwdContract.parse(value);
