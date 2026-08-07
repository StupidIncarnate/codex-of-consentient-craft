import type { StubArgument } from '@dungeonmaster/shared/@types';

import { QuestSummaryFlowStub } from '../quest-summary-flow/quest-summary-flow.stub';
import { QuestSummaryNoteGroupStub } from '../quest-summary-note-group/quest-summary-note-group.stub';
import { QuestSummaryObservableStub } from '../quest-summary-observable/quest-summary-observable.stub';
import { QuestSummaryUnconfirmableStub } from '../quest-summary-unconfirmable/quest-summary-unconfirmable.stub';
import { questSummaryContract } from './quest-summary-contract';
import type { QuestSummary } from './quest-summary-contract';

export const QuestSummaryStub = ({ ...props }: StubArgument<QuestSummary> = {}): QuestSummary =>
  questSummaryContract.parse({
    questId: 'add-auth',
    flows: [QuestSummaryFlowStub()],
    midQuestObservables: [QuestSummaryObservableStub()],
    unconfirmable: [QuestSummaryUnconfirmableStub()],
    noteGroups: [QuestSummaryNoteGroupStub()],
    ...props,
  });
