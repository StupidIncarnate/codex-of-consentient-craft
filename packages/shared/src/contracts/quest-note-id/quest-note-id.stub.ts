import type { QuestNote } from '../quest-note/quest-note-contract';
import { questNoteContract } from '../quest-note/quest-note-contract';

const questNoteIdContract = questNoteContract.shape.id;

export const QuestNoteIdStub = (
  { value }: { value: string } = { value: 'open-question-comment-anchor-scope' },
): QuestNote['id'] => questNoteIdContract.parse(value);
