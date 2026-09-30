import type { StubArgument } from '@dungeonmaster/shared/@types';
import { questHumanVerdictResponseDataContract } from './quest-human-verdict-response-data-contract';
import type { QuestHumanVerdictResponseData } from './quest-human-verdict-response-data-contract';

export const QuestHumanVerdictResponseDataStub = ({
  ...props
}: StubArgument<QuestHumanVerdictResponseData> = {}): QuestHumanVerdictResponseData =>
  questHumanVerdictResponseDataContract.parse({
    ok: true,
    ...props,
  });
