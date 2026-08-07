import { questNoteKindContract } from './quest-note-kind-contract';
import type { QuestNoteKind } from './quest-note-kind-contract';

export const QuestNoteKindStub = (
  { value }: { value: string } = { value: 'open-question' },
): QuestNoteKind => questNoteKindContract.parse(value);
