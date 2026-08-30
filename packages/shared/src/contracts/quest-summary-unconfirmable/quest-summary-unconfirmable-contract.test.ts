import { SignoffStub } from '../signoff/signoff.stub';
import { signoffDenominatorTrackContract } from '../signoff-denominator-track/signoff-denominator-track-contract';
import { questSummaryUnconfirmableContract } from './quest-summary-unconfirmable-contract';
import { QuestSummaryUnconfirmableStub } from './quest-summary-unconfirmable.stub';

describe('questSummaryUnconfirmableContract', () => {
  describe('valid entries', () => {
    it('VALID: {flowrider entry} => parses the unit, the track and the whole sign-off', () => {
      expect(QuestSummaryUnconfirmableStub()).toStrictEqual({
        id: 'login-flow:observable:rejects-bleh-payload:flowrider',
        unitId: 'login-flow:observable:rejects-bleh-payload',
        flowId: 'login-flow',
        kind: 'observable',
        track: 'flowrider',
        signoff: SignoffStub({
          verdict: 'unconfirmable',
          evidence:
            'the project playwright.config.ts declares no webServer, so no e2e run can reach the app',
          question: 'Who owns adding a webServer block to playwright.config.ts?',
        }),
      });
    });

    it.each(signoffDenominatorTrackContract.options)(
      'VALID: {track: %s} => every denominator track can record an unconfirmable',
      (track) => {
        expect(QuestSummaryUnconfirmableStub({ track }).track).toBe(track);
      },
    );

    it('VALID: {kind: "off-map"} => an off-map probe family is a legal unit kind here', () => {
      expect(
        QuestSummaryUnconfirmableStub({
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
        signoff: SignoffStub({
          verdict: 'unconfirmable',
          evidence:
            'the project playwright.config.ts declares no webServer, so no e2e run can reach the app',
          question: 'Who owns adding a webServer block to playwright.config.ts?',
        }),
      });
    });

    it('VALID: {signoff: confirmed} => parses, the shape carries a verdict rather than policing it', () => {
      expect(QuestSummaryUnconfirmableStub({ signoff: SignoffStub() }).signoff.verdict).toBe(
        'confirmed',
      );
    });
  });

  describe('invalid input', () => {
    it('INVALID: {signoff unconfirmable with no question} => throws, an unconfirmable must be routable', () => {
      expect(() =>
        questSummaryUnconfirmableContract.parse({
          id: 'login-flow:observable:rejects-bleh-payload:flowrider',
          unitId: 'login-flow:observable:rejects-bleh-payload',
          flowId: 'login-flow',
          kind: 'observable',
          track: 'flowrider',
          signoff: {
            verdict: 'unconfirmable',
            evidence: 'no dev server was reachable',
            workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            at: '2026-01-01T00:00:00.000Z',
          },
        }),
      ).toThrow(/question is required when verdict is unconfirmable/u);
    });

    it('INVALID: {unitId: "not-three-segments"} => throws', () => {
      expect(() => QuestSummaryUnconfirmableStub({ unitId: 'not-three-segments' })).toThrow(
        /Invalid/u,
      );
    });

    it('EMPTY: {id: ""} => throws', () => {
      expect(() => QuestSummaryUnconfirmableStub({ id: '' })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID: {kind: "path"} => throws', () => {
      expect(() => QuestSummaryUnconfirmableStub({ kind: 'path' as never })).toThrow(
        /Invalid enum value/u,
      );
    });
  });
});
