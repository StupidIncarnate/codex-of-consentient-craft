import type { StubArgument } from '@dungeonmaster/shared/@types';
import { questClarifyBodyContract } from './quest-clarify-body-contract';
import type { QuestClarifyBody } from './quest-clarify-body-contract';

export const QuestClarifyBodyStub = ({
  ...props
}: StubArgument<QuestClarifyBody> = {}): QuestClarifyBody =>
  questClarifyBodyContract.parse({
    answers: [{ header: 'q1', labels: ['a1'] }],
    questions: [
      {
        question: 'a question',
        header: 'q1',
        options: [{ label: 'a1', description: 'first option' }],
        multiSelect: false,
      },
    ],
    ...props,
  });
