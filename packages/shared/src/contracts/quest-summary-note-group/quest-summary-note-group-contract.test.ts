import { QuestNoteStub } from '../quest-note/quest-note.stub';
import { questNoteKindContract } from '../quest-note-kind/quest-note-kind-contract';
import { questSummaryNoteGroupContract } from './quest-summary-note-group-contract';
import { QuestSummaryNoteGroupStub } from './quest-summary-note-group.stub';

describe('questSummaryNoteGroupContract', () => {
  describe('valid groups', () => {
    it('VALID: {open-question group} => parses the kind and its notes', () => {
      expect(QuestSummaryNoteGroupStub()).toStrictEqual({
        id: 'open-question',
        notes: [QuestNoteStub()],
      });
    });

    it.each(questNoteKindContract.options)(
      'VALID: {id: %s} => every note kind is a legal group id',
      (kind) => {
        expect(QuestSummaryNoteGroupStub({ id: kind, notes: [] })).toStrictEqual({
          id: kind,
          notes: [],
        });
      },
    );

    it('EMPTY: {id only} => defaults notes to an empty list, which is the answer "none of these"', () => {
      expect(questSummaryNoteGroupContract.parse({ id: 'tooling-error' })).toStrictEqual({
        id: 'tooling-error',
        notes: [],
      });
    });

    it('VALID: {two notes} => keeps both in the order given', () => {
      expect(
        QuestSummaryNoteGroupStub({
          id: 'walk-reset',
          notes: [
            QuestNoteStub({ id: 'walk-reset-one', kind: 'walk-reset' }),
            QuestNoteStub({ id: 'walk-reset-two', kind: 'walk-reset' }),
          ],
        }),
      ).toStrictEqual({
        id: 'walk-reset',
        notes: [
          QuestNoteStub({ id: 'walk-reset-one', kind: 'walk-reset' }),
          QuestNoteStub({ id: 'walk-reset-two', kind: 'walk-reset' }),
        ],
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {id: "blocker"} => throws, the group id is a note kind', () => {
      expect(() => QuestSummaryNoteGroupStub({ id: 'blocker' as never })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('INVALID: {notes: [{}]} => throws, a note carries required fields', () => {
      expect(() =>
        questSummaryNoteGroupContract.parse({ id: 'out-of-scope', notes: [{}] }),
      ).toThrow(/Required/u);
    });
  });
});
