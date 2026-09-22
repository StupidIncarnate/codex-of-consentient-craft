import { signoffDenominatorTrackContract } from '../signoff-denominator-track/signoff-denominator-track-contract';
import { questSummaryDebtContract } from './quest-summary-debt-contract';
import { QuestSummaryDebtStub } from './quest-summary-debt.stub';

describe('questSummaryDebtContract', () => {
  describe('valid entries', () => {
    it('VALID: {mark: unmet, no toSettle} => parses the unit, the track and the outstanding mark', () => {
      expect(QuestSummaryDebtStub()).toStrictEqual({
        id: 'login-flow:observable:rejects-bleh-payload:flowrider',
        unitId: 'login-flow:observable:rejects-bleh-payload',
        flowId: 'login-flow',
        kind: 'observable',
        track: 'flowrider',
        mark: 'unmet',
        evidence:
          'the badge still renders the stale count after the queue drains; no test reaches it',
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        at: '2026-01-01T00:00:00.000Z',
      });
    });

    it('VALID: {mark: cant-meet, toSettle present} => parses and keeps the instruction', () => {
      expect(
        QuestSummaryDebtStub({
          mark: 'cant-meet',
          evidence: 'playwright.config.ts declares no webServer, so no e2e run reaches the app',
          toSettle:
            'Add a webServer block to playwright.config.ts, then re-run this spec against it.',
        }),
      ).toStrictEqual({
        id: 'login-flow:observable:rejects-bleh-payload:flowrider',
        unitId: 'login-flow:observable:rejects-bleh-payload',
        flowId: 'login-flow',
        kind: 'observable',
        track: 'flowrider',
        mark: 'cant-meet',
        evidence: 'playwright.config.ts declares no webServer, so no e2e run reaches the app',
        toSettle:
          'Add a webServer block to playwright.config.ts, then re-run this spec against it.',
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        at: '2026-01-01T00:00:00.000Z',
      });
    });

    it.each(signoffDenominatorTrackContract.options)(
      'VALID: {track: %s} => every denominator track can carry debt',
      (track) => {
        expect(QuestSummaryDebtStub({ track }).track).toBe(track);
      },
    );

    it('VALID: {kind: "off-map"} => an off-map probe family is a legal unit kind here', () => {
      expect(
        QuestSummaryDebtStub({
          id: 'login-flow:off-map:perf:siegemaster',
          unitId: 'login-flow:off-map:perf',
          kind: 'off-map',
          track: 'siegemaster',
        }),
      ).toStrictEqual({
        id: 'login-flow:off-map:perf:siegemaster',
        unitId: 'login-flow:off-map:perf',
        flowId: 'login-flow',
        kind: 'off-map',
        track: 'siegemaster',
        mark: 'unmet',
        evidence:
          'the badge still renders the stale count after the queue drains; no test reaches it',
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        at: '2026-01-01T00:00:00.000Z',
      });
    });
  });

  describe('the mark this list refuses', () => {
    it('INVALID: {mark: met} => refused, a proven unit is not debt', () => {
      expect(() => QuestSummaryDebtStub({ mark: 'met' as never })).toThrow(
        /Invalid enum value. Expected 'cant-meet' \| 'unmet', received 'met'/u,
      );
    });

    it('VALID: {mark options} => the enum carries cant-meet and unmet and nothing else', () => {
      expect(questSummaryDebtContract.innerType().shape.mark.options).toStrictEqual([
        'cant-meet',
        'unmet',
      ]);
    });
  });

  describe('the toSettle pairing refinement', () => {
    it('INVALID: {mark: cant-meet, no toSettle} => refused, naming toSettle as required', () => {
      expect(() => QuestSummaryDebtStub({ mark: 'cant-meet' })).toThrow(
        /toSettle is required when mark is 'cant-meet'/u,
      );
    });

    it('INVALID: {mark: unmet, toSettle present} => refused, an outstanding unit has a successor', () => {
      expect(() =>
        QuestSummaryDebtStub({
          toSettle:
            'Add a webServer block to playwright.config.ts, then re-run this spec against it.',
        }),
      ).toThrow(/toSettle is only valid when mark is 'cant-meet'/u);
    });
  });

  describe('invalid input', () => {
    it('INVALID: {unitId: "not-three-segments"} => throws', () => {
      expect(() => QuestSummaryDebtStub({ unitId: 'not-three-segments' })).toThrow(/Invalid/u);
    });

    it('EMPTY: {id: ""} => throws', () => {
      expect(() => QuestSummaryDebtStub({ id: '' })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID: {kind: "path"} => throws', () => {
      expect(() => QuestSummaryDebtStub({ kind: 'path' as never })).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {workItemId: "not-a-uuid"} => throws, the entry must route back to a session', () => {
      expect(() => QuestSummaryDebtStub({ workItemId: 'not-a-uuid' as never })).toThrow(
        /Invalid uuid/u,
      );
    });

    it('EMPTY: {empty object} => reports failure on every required field', () => {
      expect(questSummaryDebtContract.safeParse({}).success).toBe(false);
    });

    it('EMPTY: {workItemId omitted} => refused, nothing routes the debt back to a session', () => {
      const { workItemId: _unusedWorkItemId, ...withoutWorkItemId } = QuestSummaryDebtStub();

      expect(() => questSummaryDebtContract.parse(withoutWorkItemId)).toThrow(
        /"path": \[\s*"workItemId"\s*\]/u,
      );
    });

    it('EMPTY: {at omitted} => refused, nothing says when the wall was hit', () => {
      const { at: _unusedAt, ...withoutAt } = QuestSummaryDebtStub();

      expect(() => questSummaryDebtContract.parse(withoutAt)).toThrow(/"path": \[\s*"at"\s*\]/u);
    });
  });
});
