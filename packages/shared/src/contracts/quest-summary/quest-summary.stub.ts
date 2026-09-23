import type { StubArgument } from '@dungeonmaster/shared/@types';

import { QuestSummaryDebtStub } from '../quest-summary-debt/quest-summary-debt.stub';
import { QuestSummaryFlowStub } from '../quest-summary-flow/quest-summary-flow.stub';
import { QuestSummaryNoteGroupStub } from '../quest-summary-note-group/quest-summary-note-group.stub';
import { QuestSummaryObservableStub } from '../quest-summary-observable/quest-summary-observable.stub';
import { questSummaryContract } from './quest-summary-contract';
import type { QuestSummary } from './quest-summary-contract';

export const QuestSummaryStub = ({ ...props }: StubArgument<QuestSummary> = {}): QuestSummary =>
  questSummaryContract.parse({
    questId: 'add-auth',
    flows: [QuestSummaryFlowStub()],
    midQuestObservables: [QuestSummaryObservableStub()],
    debt: [QuestSummaryDebtStub()],
    humanChecks: [QuestSummaryObservableStub()],
    noteGroups: [QuestSummaryNoteGroupStub()],
    ...props,
  });
