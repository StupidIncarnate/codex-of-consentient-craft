import type { StubArgument } from '@dungeonmaster/shared/@types';
import { GuildIdStub } from '@dungeonmaster/shared/contracts';
import { questUserAddBodyContract } from './quest-user-add-body-contract';
import type { QuestUserAddBody } from './quest-user-add-body-contract';

export const QuestUserAddBodyStub = ({
  ...props
}: StubArgument<QuestUserAddBody> = {}): QuestUserAddBody =>
  questUserAddBodyContract.parse({
    title: 'Test Quest',
    userRequest: 'Build it',
    guildId: GuildIdStub(),
    ...props,
  });
