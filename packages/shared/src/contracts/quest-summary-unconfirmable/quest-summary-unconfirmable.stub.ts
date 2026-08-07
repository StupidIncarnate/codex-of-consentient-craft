import type { StubArgument } from '@dungeonmaster/shared/@types';

import { SignoffStub } from '../signoff/signoff.stub';
import { questSummaryUnconfirmableContract } from './quest-summary-unconfirmable-contract';
import type { QuestSummaryUnconfirmable } from './quest-summary-unconfirmable-contract';

export const QuestSummaryUnconfirmableStub = ({
  ...props
}: StubArgument<QuestSummaryUnconfirmable> = {}): QuestSummaryUnconfirmable =>
  questSummaryUnconfirmableContract.parse({
    id: 'login-flow:observable:rejects-bleh-payload:flowrider',
    unitId: 'login-flow:observable:rejects-bleh-payload',
    flowId: 'login-flow',
    kind: 'observable',
    track: 'flowrider',
    signoff: SignoffStub({
      verdict: 'unconfirmable',
      evidence:
        'the project playwright.config.ts declares no webServer, so no e2e run can reach the app',
      question: 'Who owns adding a webServer block to playwright.config.ts?',
    }),
    ...props,
  });
