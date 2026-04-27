import type { StubArgument } from '@dungeonmaster/shared/@types';
import { questClarifyBodyContract } from './quest-clarify-body-contract';
import type { QuestClarifyBody } from './quest-clarify-body-contract';

export const QuestClarifyBodyStub = ({
  ...props
}: StubArgument<QuestClarifyBody> = {}): QuestClarifyBody =>
  questClarifyBodyContract.parse({
    answers: [{ header: 'q1', label: 'a1' }],
    questions: [{ id: 'q1', text: 'a question' }],
    ...props,
  });
