import type { StubArgument } from '@dungeonmaster/shared/@types';

import { QuestNoteStub } from '../quest-note/quest-note.stub';
import { questSummaryNoteGroupContract } from './quest-summary-note-group-contract';
import type { QuestSummaryNoteGroup } from './quest-summary-note-group-contract';

export const QuestSummaryNoteGroupStub = ({
  ...props
}: StubArgument<QuestSummaryNoteGroup> = {}): QuestSummaryNoteGroup =>
  questSummaryNoteGroupContract.parse({
    id: 'open-question',
    notes: [QuestNoteStub()],
    ...props,
  });
