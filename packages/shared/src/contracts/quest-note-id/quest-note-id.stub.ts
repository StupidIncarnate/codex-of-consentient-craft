import { questNoteIdContract } from './quest-note-id-contract';
import type { QuestNoteId } from './quest-note-id-contract';

export const QuestNoteIdStub = (
  { value }: { value: string } = { value: 'open-question-comment-anchor-scope' },
): QuestNoteId => questNoteIdContract.parse(value);
