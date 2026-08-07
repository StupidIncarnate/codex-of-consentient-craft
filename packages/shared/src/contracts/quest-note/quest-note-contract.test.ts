import { questNoteContract } from './quest-note-contract';
import { QuestNoteStub } from './quest-note.stub';

describe('questNoteContract', () => {
  describe('unit-scoped note', () => {
    it('VALID: {open-question scoped to a flow and a unit} => parses the complete note', () => {
      expect(QuestNoteStub()).toStrictEqual({
        id: 'open-question-comment-anchor-scope',
        kind: 'open-question',
        role: 'siegemaster',
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        flowId: 'view-persisted-comments',
        unitId: 'view-persisted-comments:observable:check-badge-count-text',
        summary: 'Should a stale anchor notify per box or once per batch?',
        detail:
          'The batch send drops boxes whose node id no longer exists in the flow. Asked the operator; no answer landed before the walk ended.',
        at: '2026-01-01T00:00:00.000Z',
      });
    });
  });

  describe('quest-wide note', () => {
    it('VALID: {flowId and unitId omitted} => parses, because a tooling failure is not scoped to a flow', () => {
      expect(
        questNoteContract.parse({
          id: 'tooling-error-playwright-binary-missing',
          kind: 'tooling-error',
          role: 'flowrider',
          workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          summary: 'Playwright browsers are not installed in this environment',
          detail:
            'npx playwright test exits 1 with "Executable doesn\'t exist" before any spec runs, so no e2e observable could be reached this pass.',
          at: '2026-01-02T00:00:00.000Z',
        }),
      ).toStrictEqual({
        id: 'tooling-error-playwright-binary-missing',
        kind: 'tooling-error',
        role: 'flowrider',
        workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        summary: 'Playwright browsers are not installed in this environment',
        detail:
          'npx playwright test exits 1 with "Executable doesn\'t exist" before any spec runs, so no e2e observable could be reached this pass.',
        at: '2026-01-02T00:00:00.000Z',
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {summary: ""} => throws, so no note lands without the line a reader scans', () => {
      expect(() => QuestNoteStub({ summary: '' as never })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID: {kind: "blocked"} => throws, because the note kinds are a closed set', () => {
      expect(() => QuestNoteStub({ kind: 'blocked' as never })).toThrow(/Invalid enum value/u);
    });

    it('EMPTY: {id: ""} => throws, because an un-addressable note would make every write replace the array', () => {
      expect(() => QuestNoteStub({ id: '' as never })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID: {at: "2026-01-01"} => throws', () => {
      expect(() => QuestNoteStub({ at: '2026-01-01' as never })).toThrow(/Invalid datetime/u);
    });
  });
});
