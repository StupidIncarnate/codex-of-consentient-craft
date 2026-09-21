import { unitMarkChurnEntryContract } from './unit-mark-churn-entry-contract';
import { UnitMarkChurnEntryStub } from './unit-mark-churn-entry.stub';

const MARKS = unitMarkChurnEntryContract.shape.mark.unwrap().options;

describe('unitMarkChurnEntryContract', () => {
  describe('valid entries', () => {
    it('VALID: {no overrides} => parses a met row', () => {
      expect(UnitMarkChurnEntryStub()).toStrictEqual({
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        step: 'work',
        mark: 'met',
        evidence:
          'packages/x/src/a-transformer.test.ts:42 — flips to red when the guard returns true',
        toSettle: null,
        at: '2026-01-01T00:00:00.000Z',
      });
    });

    it.each(MARKS)('VALID: {mark: %s} => parses', (mark) => {
      expect(UnitMarkChurnEntryStub({ mark }).mark).toBe(mark);
    });

    it("VALID: {mark: 'cant-meet', toSettle} => carries the instruction alongside the dead end", () => {
      expect(
        UnitMarkChurnEntryStub({
          mark: 'cant-meet',
          evidence: 'no layer below the browser reaches the rendered badge',
          toSettle: 'drive a real send through a live quest and read the session JSONL',
        }),
      ).toStrictEqual({
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        step: 'work',
        mark: 'cant-meet',
        evidence: 'no layer below the browser reaches the rendered badge',
        toSettle: 'drive a real send through a live quest and read the session JSONL',
        at: '2026-01-01T00:00:00.000Z',
      });
    });
  });

  describe('the row a crashed session leaves', () => {
    it('EMPTY: {mark: null, evidence: null, step: null} => parses, which is what makes the crash visible', () => {
      expect(
        UnitMarkChurnEntryStub({ step: null, mark: null, evidence: null, toSettle: null }),
      ).toStrictEqual({
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        step: null,
        mark: null,
        evidence: null,
        toSettle: null,
        at: '2026-01-01T00:00:00.000Z',
      });
    });

    it('EMPTY: {no toSettle key} => parses, since toSettle is nullish rather than nullable', () => {
      expect(
        unitMarkChurnEntryContract.parse({
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          step: null,
          mark: null,
          evidence: null,
          at: '2026-01-01T00:00:00.000Z',
        }),
      ).toStrictEqual({
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        step: null,
        mark: null,
        evidence: null,
        at: '2026-01-01T00:00:00.000Z',
      });
    });
  });

  describe('invalid entries', () => {
    it('EMPTY: {empty object} => refused', () => {
      expect(unitMarkChurnEntryContract.safeParse({}).success).toBe(false);
    });

    it('EMPTY: {mark omitted} => refused, since a null mark is stated rather than left out', () => {
      expect(
        unitMarkChurnEntryContract.safeParse({
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          step: null,
          evidence: null,
          at: '2026-01-01T00:00:00.000Z',
        }).success,
      ).toBe(false);
    });

    it('EMPTY: {at: null} => refused, since a row with no time cannot be placed in the sequence', () => {
      expect(() => UnitMarkChurnEntryStub({ at: null as never })).toThrow(/Expected string/u);
    });

    it("INVALID: {workItemId: 'wi1'} => refused, since a work item id is a uuid", () => {
      expect(() => UnitMarkChurnEntryStub({ workItemId: 'wi1' })).toThrow(/Invalid uuid/u);
    });

    it('EMPTY: {evidence: empty string} => refused, since an empty mark note is not a null one', () => {
      expect(() => UnitMarkChurnEntryStub({ evidence: '' })).toThrow(
        /String must contain at least 1 character/u,
      );
    });
  });
});
