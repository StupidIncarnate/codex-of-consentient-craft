import type { QuestNote } from '../quest-note/quest-note-contract';
import { questNoteContract } from '../quest-note/quest-note-contract';

export const QuestNoteIdStub = (
  { value }: { value: string } = { value: 'open-question-comment-anchor-scope' },
): QuestNote['id'] => questNoteContract.shape.id.parse(value);
