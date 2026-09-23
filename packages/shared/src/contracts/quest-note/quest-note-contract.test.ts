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

  describe('workItemId nullish', () => {
    it('VALID: {workItemId: null} => parses, so a note reloaded off disk with a cleared work item still validates', () => {
      const result = questNoteContract.parse({
        id: 'open-question-comment-anchor-scope',
        kind: 'open-question',
        role: 'siegemaster',
        workItemId: null,
        summary: 'Should a stale anchor notify per box or once per batch?',
        detail: 'The batch send drops boxes whose node id no longer exists in the flow.',
        at: '2026-01-01T00:00:00.000Z',
      });

      expect(result).toStrictEqual({
        id: 'open-question-comment-anchor-scope',
        kind: 'open-question',
        role: 'siegemaster',
        workItemId: null,
        summary: 'Should a stale anchor notify per box or once per batch?',
        detail: 'The batch send drops boxes whose node id no longer exists in the flow.',
        at: '2026-01-01T00:00:00.000Z',
      });
    });
  });

  describe('walked note', () => {
    it('VALID: {kind: walked, instanceId, runId} => parses, and the ids come back branded', () => {
      const result = questNoteContract.parse({
        id: 'walked-login-flow-path-3',
        kind: 'walked',
        role: 'siegemaster-verifier',
        workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        flowId: 'login-flow',
        instanceId: 'inst_9b2c1234',
        runId: 'run_2',
        summary: 'Path 3 walked: entry → guild selected → quest open → row expanded',
        detail: '6 units signed, 1 issue raised.',
        at: '2026-09-14T00:00:00.000Z',
      });

      expect(result).toStrictEqual({
        id: 'walked-login-flow-path-3',
        kind: 'walked',
        role: 'siegemaster-verifier',
        workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        flowId: 'login-flow',
        instanceId: 'inst_9b2c1234',
        runId: 'run_2',
        summary: 'Path 3 walked: entry → guild selected → quest open → row expanded',
        detail: '6 units signed, 1 issue raised.',
        at: '2026-09-14T00:00:00.000Z',
      });
    });

    it('INVALID: {kind: walked, instanceId: "not-an-instance-id"} => throws, naming the instance id shape', () => {
      expect(() =>
        questNoteContract.parse({
          id: 'walked-login-flow-path-3',
          kind: 'walked',
          role: 'siegemaster-verifier',
          workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          instanceId: 'not-an-instance-id',
          runId: 'run_2',
          summary: 'Path 3 walked',
          detail: '6 units signed.',
          at: '2026-09-14T00:00:00.000Z',
        }),
      ).toThrow(/invalid_string/u);
    });

    it('INVALID: {kind: walked, runId: "not-a-run-id"} => throws, naming the run id shape', () => {
      expect(() =>
        questNoteContract.parse({
          id: 'walked-login-flow-path-3',
          kind: 'walked',
          role: 'siegemaster-verifier',
          workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          instanceId: 'inst_9b2c1234',
          runId: 'not-a-run-id',
          summary: 'Path 3 walked',
          detail: '6 units signed.',
          at: '2026-09-14T00:00:00.000Z',
        }),
      ).toThrow(/invalid_string/u);
    });

    it('VALID: {instanceId: null, runId: null} => parses, so a note reloaded off disk with a cleared pair still validates', () => {
      const result = questNoteContract.parse({
        id: 'open-question-comment-anchor-scope',
        kind: 'open-question',
        role: 'siegemaster',
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        instanceId: null,
        runId: null,
        summary: 'Should a stale anchor notify per box or once per batch?',
        detail: 'The batch send drops boxes whose node id no longer exists in the flow.',
        at: '2026-01-01T00:00:00.000Z',
      });

      expect(result).toStrictEqual({
        id: 'open-question-comment-anchor-scope',
        kind: 'open-question',
        role: 'siegemaster',
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        instanceId: null,
        runId: null,
        summary: 'Should a stale anchor notify per box or once per batch?',
        detail: 'The batch send drops boxes whose node id no longer exists in the flow.',
        at: '2026-01-01T00:00:00.000Z',
      });
    });
  });

  describe('human-verdict note', () => {
    it('VALID: {kind: human-verdict, outcome: met, unitId} => parses, carrying the branded outcome', () => {
      const result = questNoteContract.parse({
        id: 'human-verdict-motion-feels-smooth',
        kind: 'human-verdict',
        role: 'operator',
        workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        flowId: 'login-flow',
        unitId: 'motion-feels-smooth',
        outcome: 'met',
        summary: 'Motion feels smooth: confirmed',
        detail: 'Watched run_7/walk.webm end to end — the transition never stutters.',
        at: '2026-09-14T00:00:00.000Z',
      });

      expect(result).toStrictEqual({
        id: 'human-verdict-motion-feels-smooth',
        kind: 'human-verdict',
        role: 'operator',
        workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        flowId: 'login-flow',
        unitId: 'motion-feels-smooth',
        outcome: 'met',
        summary: 'Motion feels smooth: confirmed',
        detail: 'Watched run_7/walk.webm end to end — the transition never stutters.',
        at: '2026-09-14T00:00:00.000Z',
      });
    });

    it('VALID: {kind: human-verdict, outcome: not-met, unitId} => parses, the reason carried in detail', () => {
      const result = questNoteContract.parse({
        id: 'human-verdict-motion-feels-smooth',
        kind: 'human-verdict',
        role: 'operator',
        workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        unitId: 'motion-feels-smooth',
        outcome: 'not-met',
        summary: 'Motion feels smooth: rejected',
        detail: 'The panel jumps two pixels right before it settles — visibly janky.',
        at: '2026-09-14T00:00:00.000Z',
      });

      expect(result).toStrictEqual({
        id: 'human-verdict-motion-feels-smooth',
        kind: 'human-verdict',
        role: 'operator',
        workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        unitId: 'motion-feels-smooth',
        outcome: 'not-met',
        summary: 'Motion feels smooth: rejected',
        detail: 'The panel jumps two pixels right before it settles — visibly janky.',
        at: '2026-09-14T00:00:00.000Z',
      });
    });

    it('VALID: {kind: human-verdict, no workItemId} => parses, because a person clicking a browser button has no work item', () => {
      const result = questNoteContract.parse({
        id: 'human-verdict-motion-feels-smooth',
        kind: 'human-verdict',
        role: 'operator',
        flowId: 'login-flow',
        unitId: 'motion-feels-smooth',
        outcome: 'met',
        summary: 'Motion feels smooth: confirmed',
        detail: 'Watched run_7/walk.webm end to end — the transition never stutters.',
        at: '2026-09-14T00:00:00.000Z',
      });

      expect(result).toStrictEqual({
        id: 'human-verdict-motion-feels-smooth',
        kind: 'human-verdict',
        role: 'operator',
        flowId: 'login-flow',
        unitId: 'motion-feels-smooth',
        outcome: 'met',
        summary: 'Motion feels smooth: confirmed',
        detail: 'Watched run_7/walk.webm end to end — the transition never stutters.',
        at: '2026-09-14T00:00:00.000Z',
      });
    });

    it('INVALID: {outcome: "confirmed"} => throws, because the outcome set is closed to met/not-met', () => {
      expect(() =>
        QuestNoteStub({
          kind: 'human-verdict',
          unitId: 'motion-feels-smooth',
          outcome: 'confirmed' as never,
        }),
      ).toThrow(/Invalid enum value/u);
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
