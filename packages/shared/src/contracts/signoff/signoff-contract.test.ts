import { signoffContract } from './signoff-contract';
import { SignoffStub } from './signoff.stub';

describe('signoffContract', () => {
  describe('confirmed verdict', () => {
    it('VALID: {confirmed with evidence} => parses the complete sign-off', () => {
      expect(SignoffStub()).toStrictEqual({
        verdict: 'confirmed',
        evidence:
          'packages/x/src/a-transformer.test.ts:42 — flips to red when the guard returns true',
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        at: '2026-01-01T00:00:00.000Z',
      });
    });

    it('VALID: {confirmed without question} => parses, because a question is only owed when confirmation failed', () => {
      expect(
        signoffContract.parse({
          verdict: 'confirmed',
          evidence: 'COMMENT_COUNT_BADGE rendered the string "2"',
          workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          at: '2026-01-01T00:00:00.000Z',
        }),
      ).toStrictEqual({
        verdict: 'confirmed',
        evidence: 'COMMENT_COUNT_BADGE rendered the string "2"',
        workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        at: '2026-01-01T00:00:00.000Z',
      });
    });
  });

  describe('unconfirmable verdict', () => {
    it('VALID: {unconfirmable with question} => parses the complete sign-off', () => {
      expect(
        SignoffStub({
          verdict: 'unconfirmable',
          evidence: 'no browser bridge is reachable from this session, so the DOM cannot be read',
          toSettle:
            'Push a websocket update and read whether the badge re-renders without a route change.',
        }),
      ).toStrictEqual({
        verdict: 'unconfirmable',
        evidence: 'no browser bridge is reachable from this session, so the DOM cannot be read',
        toSettle:
          'Push a websocket update and read whether the badge re-renders without a route change.',
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        at: '2026-01-01T00:00:00.000Z',
      });
    });

    it('INVALID: {unconfirmable without toSettle} => throws, so "could not confirm" is never a shrug', () => {
      expect(() =>
        SignoffStub({
          verdict: 'unconfirmable',
          evidence: 'fault injection needs a hook the repo does not ship',
        }),
      ).toThrow(
        /toSettle is required when verdict is unconfirmable — state the action that would settle this unit, as an instruction rather than a question/u,
      );
    });

    // superRefine rather than refine: the issue must name the ONE missing field. A form-level issue
    // (path: []) would tell a reader the whole sign-off is malformed when only `toSettle` is absent.
    it('INVALID: {unconfirmable without toSettle} => raises exactly one issue, scoped to the toSettle field', () => {
      const result = signoffContract.safeParse({
        verdict: 'unconfirmable',
        evidence: 'fault injection needs a hook the repo does not ship',
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        at: '2026-01-01T00:00:00.000Z',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'custom',
          path: ['toSettle'],
          message:
            'toSettle is required when verdict is unconfirmable — state the action that would settle this unit, as an instruction rather than a question',
        },
      ]);
    });
  });

  describe('evidence is mandatory on every verdict', () => {
    it('INVALID: {evidence: ""} => throws, so no verdict can be recorded with nothing behind it', () => {
      expect(() => SignoffStub({ evidence: '' as never })).toThrow(
        /String must contain at least 1 character/u,
      );
    });
  });

  describe('invalid input', () => {
    it('INVALID: {at: "2026-01-01"} => throws, because a date without a time cannot order two sign-offs', () => {
      expect(() => SignoffStub({ at: '2026-01-01' as never })).toThrow(/Invalid datetime/u);
    });

    it('INVALID: {workItemId: "work-item-1"} => throws', () => {
      expect(() => SignoffStub({ workItemId: 'work-item-1' as never })).toThrow(/Invalid uuid/u);
    });

    it('EMPTY: {workItemId missing entirely} => throws', () => {
      expect(() =>
        signoffContract.parse({
          verdict: 'confirmed',
          evidence: 'COMMENT_COUNT_BADGE rendered the string "2"',
          at: '2026-01-01T00:00:00.000Z',
        }),
      ).toThrow(/Required/u);
    });
  });
});
