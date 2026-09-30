import type { StubArgument } from '@dungeonmaster/shared/@types';
import { guildRemoveResponseDataContract } from './guild-remove-response-data-contract';
import type { GuildRemoveResponseData } from './guild-remove-response-data-contract';

export const GuildRemoveResponseDataStub = ({
  ...props
}: StubArgument<GuildRemoveResponseData> = {}): GuildRemoveResponseData =>
  guildRemoveResponseDataContract.parse({
    success: true,
    ...props,
  });
