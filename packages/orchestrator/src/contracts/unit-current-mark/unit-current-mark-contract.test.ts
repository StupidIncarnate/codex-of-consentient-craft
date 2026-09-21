import { unitCurrentMarkContract } from './unit-current-mark-contract';
import { UnitCurrentMarkStub } from './unit-current-mark.stub';

const MARKS = unitCurrentMarkContract.shape.mark.options;

describe('unitCurrentMarkContract', () => {
  describe('valid marks', () => {
    it('VALID: {no overrides} => parses a met observation with its work item and step, and no toSettle key', () => {
      expect(UnitCurrentMarkStub()).toStrictEqual({
        unitId: 'send-flow:observable:check-badge-count-text',
        mark: 'met',
        evidence:
          'packages/x/src/a-transformer.test.ts:42 — flips to red when the guard returns true',
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        step: 'work',
        at: '2026-01-01T00:00:00.000Z',
      });
    });

    it.each(MARKS)('VALID: {mark: %s} => parses', (mark) => {
      expect(UnitCurrentMarkStub({ mark }).mark).toBe(mark);
    });

    it("VALID: {mark: 'cant-meet', toSettle} => carries the instruction that would settle it", () => {
      expect(
        UnitCurrentMarkStub({
          mark: 'cant-meet',
          toSettle: 'drive a real send through a live quest and read the session JSONL',
        }),
      ).toStrictEqual({
        unitId: 'send-flow:observable:check-badge-count-text',
        mark: 'cant-meet',
        evidence:
          'packages/x/src/a-transformer.test.ts:42 — flips to red when the guard returns true',
        toSettle: 'drive a real send through a live quest and read the session JSONL',
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        step: 'work',
        at: '2026-01-01T00:00:00.000Z',
      });
    });

    it('EMPTY: {no step} => parses, since a chat-role work item runs no step of a family graph', () => {
      expect(
        unitCurrentMarkContract.parse({
          unitId: 'send-flow:observable:check-badge-count-text',
          mark: 'met',
          evidence: 'the badge read 2 on a box carrying two persisted comments',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          at: '2026-01-01T00:00:00.000Z',
        }),
      ).toStrictEqual({
        unitId: 'send-flow:observable:check-badge-count-text',
        mark: 'met',
        evidence: 'the badge read 2 on a box carrying two persisted comments',
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        at: '2026-01-01T00:00:00.000Z',
      });
    });
  });

  describe('invalid marks', () => {
    it('EMPTY: {empty object} => refused', () => {
      expect(unitCurrentMarkContract.safeParse({}).success).toBe(false);
    });

    it("INVALID: {unitId: 'obs-3'} => refused, since a unit id is <flowId>:<kind>:<localId>", () => {
      expect(() => UnitCurrentMarkStub({ unitId: 'obs-3' })).toThrow(/Invalid/u);
    });

    it("INVALID: {mark: 'confirmed'} => refused, since the sign-off verdicts are a different vocabulary", () => {
      expect(() => UnitCurrentMarkStub({ mark: 'confirmed' as never })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('EMPTY: {evidence: empty string} => refused', () => {
      expect(() => UnitCurrentMarkStub({ evidence: '' })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it("INVALID: {workItemId: 'wi1'} => refused, since a work item id is a uuid", () => {
      expect(() => UnitCurrentMarkStub({ workItemId: 'wi1' })).toThrow(/Invalid uuid/u);
    });

    it("INVALID: {at: '2026-01-01'} => refused, since a date alone is not an ISO datetime", () => {
      expect(() => UnitCurrentMarkStub({ at: '2026-01-01' })).toThrow(/Invalid datetime/u);
    });

    it('EMPTY: {mark: null} => refused, since an absent mark is the transformer returning null', () => {
      expect(() => UnitCurrentMarkStub({ mark: null as never })).toThrow(/Expected/u);
    });
  });
});
