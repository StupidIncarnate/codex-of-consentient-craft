import type { StubArgument } from '@dungeonmaster/shared/@types';
import { guildUpdateBodyContract } from './guild-update-body-contract';
import type { GuildUpdateBody } from './guild-update-body-contract';

export const GuildUpdateBodyStub = ({
  ...props
}: StubArgument<GuildUpdateBody> = {}): GuildUpdateBody =>
  guildUpdateBodyContract.parse({ ...props });
