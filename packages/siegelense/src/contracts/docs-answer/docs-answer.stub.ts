import type { StubArgument } from '@dungeonmaster/shared/@types';

import { docsAnswerContract } from './docs-answer-contract';
import type { DocsAnswer } from './docs-answer-contract';

export const DocsAnswerStub = ({ ...props }: StubArgument<DocsAnswer> = {}): DocsAnswer =>
  docsAnswerContract.parse({
    requested: null,
    about: ['siegelense stands up one instance of an app, drives it, and hands back READINGS.'],
    scopes: [
      {
        scope: 'walking',
        audience: 'the walker',
        summary: 'The verbs, the reading rules and the ladder.',
        sections: [
          {
            heading: 'THE LADDER',
            lines: [
              'The rule: reach for the key first. dom is the hatch — last, and always narrow.',
            ],
          },
        ],
      },
    ],
    ...props,
  });
