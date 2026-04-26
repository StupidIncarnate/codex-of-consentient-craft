import type { StubArgument } from '@dungeonmaster/shared/@types';
import { GuildIdStub } from '@dungeonmaster/shared/contracts';
import { guildMessageBodyContract } from './guild-message-body-contract';
import type { GuildMessageBody } from './guild-message-body-contract';

export const GuildMessageBodyStub = ({
  ...props
}: StubArgument<GuildMessageBody> = {}): GuildMessageBody =>
  guildMessageBodyContract.parse({
    guildId: GuildIdStub(),
    message: 'hello',
    ...props,
  });
