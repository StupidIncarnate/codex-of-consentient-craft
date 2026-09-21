import { unitObservationContract } from './unit-observation-contract';
import { UnitObservationStub } from './unit-observation.stub';

describe('unitObservationContract', () => {
  describe('malformed input', () => {
    it('EMPTY: {empty object} => reports failure on every required field', () => {
      expect(unitObservationContract.safeParse({}).success).toBe(false);
    });
  });

  describe('valid observations', () => {
    it('VALID: {mark: met, no toSettle} => parses', () => {
      const result = UnitObservationStub({ mark: 'met' });

      expect(result).toStrictEqual({
        unitId: 'send-flow:observable:check-badge-count-text',
        mark: 'met',
        evidence:
          'packages/x/src/a-transformer.test.ts:42 — flips to red when the guard returns true',
        at: '2026-01-01T00:00:00.000Z',
      });
    });

    it('VALID: {mark: unmet, no toSettle} => parses', () => {
      const result = UnitObservationStub({ mark: 'unmet' });

      expect(result.mark).toBe('unmet');
    });

    it('VALID: {mark: cant-meet, toSettle present} => parses', () => {
      const result = UnitObservationStub({
        mark: 'cant-meet',
        toSettle: 'drive a real send through a live quest and read the session JSONL',
      });

      expect(result).toStrictEqual({
        unitId: 'send-flow:observable:check-badge-count-text',
        mark: 'cant-meet',
        evidence:
          'packages/x/src/a-transformer.test.ts:42 — flips to red when the guard returns true',
        toSettle: 'drive a real send through a live quest and read the session JSONL',
        at: '2026-01-01T00:00:00.000Z',
      });
    });
  });

  describe('the toSettle pairing refinement', () => {
    it('INVALID: {mark: cant-meet, no toSettle} => refused, naming toSettle as required', () => {
      expect(() => UnitObservationStub({ mark: 'cant-meet' })).toThrow(
        /toSettle is required when mark is 'cant-meet'/u,
      );
    });

    it('INVALID: {mark: met, toSettle present} => refused', () => {
      expect(() =>
        UnitObservationStub({
          mark: 'met',
          toSettle: 'drive a real send through a live quest and read the session JSONL',
        }),
      ).toThrow(/toSettle is only valid when mark is 'cant-meet'/u);
    });

    it('INVALID: {mark: unmet, toSettle present} => refused', () => {
      expect(() =>
        UnitObservationStub({
          mark: 'unmet',
          toSettle: 'drive a real send through a live quest and read the session JSONL',
        }),
      ).toThrow(/toSettle is only valid when mark is 'cant-meet'/u);
    });
  });
});
