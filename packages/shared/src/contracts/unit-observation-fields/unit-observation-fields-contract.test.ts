import { unitObservationFieldsContract } from './unit-observation-fields-contract';
import { UnitObservationFieldsStub } from './unit-observation-fields.stub';

describe('unitObservationFieldsContract', () => {
  describe('valid fields', () => {
    it('VALID: {unitId, mark, evidence, at} => parses', () => {
      const result = UnitObservationFieldsStub({
        unitId: 'send-flow:observable:check-badge-count-text',
        mark: 'met',
        evidence: 'packages/x/src/a-transformer.test.ts:42 — flips red when the guard returns true',
        at: '2026-01-01T00:00:00.000Z',
      });

      expect(result).toStrictEqual({
        unitId: 'send-flow:observable:check-badge-count-text',
        mark: 'met',
        evidence: 'packages/x/src/a-transformer.test.ts:42 — flips red when the guard returns true',
        at: '2026-01-01T00:00:00.000Z',
      });
    });

    it('VALID: {mark: cant-meet, toSettle present} => parses with toSettle carried through', () => {
      const result = UnitObservationFieldsStub({
        mark: 'cant-meet',
        toSettle: 'drive a real send through a live quest and read the session JSONL',
      });

      expect(result.toSettle).toBe(
        'drive a real send through a live quest and read the session JSONL',
      );
    });
  });

  describe('required fields', () => {
    it('INVALID: {missing unitId} => throws', () => {
      expect(() =>
        unitObservationFieldsContract.parse({
          mark: 'met',
          evidence: 'evidence text',
          at: '2026-01-01T00:00:00.000Z',
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing mark} => throws', () => {
      expect(() =>
        unitObservationFieldsContract.parse({
          unitId: 'send-flow:observable:obs-3',
          evidence: 'evidence text',
          at: '2026-01-01T00:00:00.000Z',
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing evidence} => throws', () => {
      expect(() =>
        unitObservationFieldsContract.parse({
          unitId: 'send-flow:observable:obs-3',
          mark: 'met',
          at: '2026-01-01T00:00:00.000Z',
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing at} => throws', () => {
      expect(() =>
        unitObservationFieldsContract.parse({
          unitId: 'send-flow:observable:obs-3',
          mark: 'met',
          evidence: 'evidence text',
        }),
      ).toThrow(/Required/u);
    });
  });

  describe('the bare export supports .omit and .shape — the whole reason it exists separately', () => {
    it('VALID: {.omit({ at: true }) parses an at-less payload} => compiles and parses', () => {
      const atLessContract = unitObservationFieldsContract.omit({ at: true });

      const result = atLessContract.parse({
        unitId: 'send-flow:observable:obs-3',
        mark: 'met',
        evidence: 'evidence text',
      });

      expect(result).toStrictEqual({
        unitId: 'send-flow:observable:obs-3',
        mark: 'met',
        evidence: 'evidence text',
      });
    });

    it('VALID: {.shape.evidence parses a value directly} => is readable', () => {
      expect(unitObservationFieldsContract.shape.evidence.parse('some evidence')).toBe(
        'some evidence',
      );
    });

    it('VALID: {.shape.toSettle parses a value directly} => is readable', () => {
      expect(unitObservationFieldsContract.shape.toSettle.parse('some instruction')).toBe(
        'some instruction',
      );
    });
  });
});
