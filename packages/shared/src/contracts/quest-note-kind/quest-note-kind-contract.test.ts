import { questNoteKindContract } from './quest-note-kind-contract';
import { QuestNoteKindStub } from './quest-note-kind.stub';

describe('questNoteKindContract', () => {
  describe('enum membership', () => {
    it('VALID: {options} => exposes exactly the six side-channel note kinds', () => {
      expect(questNoteKindContract.options).toStrictEqual([
        'open-question',
        'tooling-error',
        'out-of-scope',
        'walk-reset',
        'walked',
        'human-verdict',
      ]);
    });

    it.each(questNoteKindContract.options)(
      'VALID: {kind: %s} => parses to itself, so every kind has a home outside the verdicts',
      (kind) => {
        expect(QuestNoteKindStub({ value: kind })).toBe(kind);
      },
    );
  });

  describe('default stub', () => {
    it('VALID: {no args} => defaults to open-question', () => {
      expect(QuestNoteKindStub()).toBe('open-question');
    });
  });

  describe('invalid input', () => {
    it('INVALID: {kind: "unconfirmable"} => throws, because a note never carries a workItem-observation mark', () => {
      expect(() => QuestNoteKindStub({ value: 'unconfirmable' })).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {kind: "verdict"} => throws, the near miss of the newest kind\'s own name', () => {
      expect(() => QuestNoteKindStub({ value: 'verdict' })).toThrow(/Invalid enum value/u);
    });

    it('EMPTY: {kind: ""} => throws', () => {
      expect(() => QuestNoteKindStub({ value: '' })).toThrow(/Invalid enum value/u);
    });
  });
});
