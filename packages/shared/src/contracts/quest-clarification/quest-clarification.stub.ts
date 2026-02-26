import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questClarificationContract } from './quest-clarification-contract';
import type { QuestClarification } from './quest-clarification-contract';

export const QuestClarificationStub = ({
  ...props
}: StubArgument<QuestClarification> = {}): QuestClarification =>
  questClarificationContract.parse({
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    questions: [
      {
        question: 'Which approach do you prefer?',
        header: 'Design Choice',
        options: [
          { label: 'Option A', description: 'First approach' },
          { label: 'Option B', description: 'Second approach' },
        ],
        multiSelect: false,
      },
    ],
    answer: 'Option A',
    timestamp: '2024-01-15T10:00:00.000Z',
    ...props,
  });
