import type { StubArgument } from '@dungeonmaster/shared/@types';
import { GuildIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';
import { sessionClarifyBodyContract } from './session-clarify-body-contract';
import type { SessionClarifyBody } from './session-clarify-body-contract';

export const SessionClarifyBodyStub = ({
  ...props
}: StubArgument<SessionClarifyBody> = {}): SessionClarifyBody =>
  sessionClarifyBodyContract.parse({
    guildId: GuildIdStub(),
    questId: QuestIdStub(),
    answers: [{ id: 'a', answer: 'yes' }],
    questions: [],
    ...props,
  });
