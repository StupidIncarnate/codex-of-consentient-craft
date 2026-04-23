import { smoketestAssertionContract } from './smoketest-assertion-contract';
import {
  QuestStatusAssertionStub,
  WorkItemRoleCountAssertionStub,
  WorkItemStatusHistogramAssertionStub,
} from './smoketest-assertion.stub';

describe('smoketestAssertionContract', () => {
  describe('valid assertions', () => {
    it('VALID: {kind: "quest-status", expected: "complete"} => parses to quest-status assertion', () => {
      const result = QuestStatusAssertionStub();

      expect(result).toStrictEqual({
        kind: 'quest-status',
        expected: 'complete',
      });
    });

    it('VALID: {kind: "quest-status", expected: "blocked"} => parses to quest-status assertion with blocked', () => {
      const result = QuestStatusAssertionStub({ expected: 'blocked' });

      expect(result).toStrictEqual({
        kind: 'quest-status',
        expected: 'blocked',
      });
    });

    it('VALID: {kind: "work-item-status-histogram", expected: {complete: 3, skipped: 1}} => parses to histogram assertion', () => {
      const result = WorkItemStatusHistogramAssertionStub();

      expect(result).toStrictEqual({
        kind: 'work-item-status-histogram',
        expected: { complete: 3, skipped: 1 },
      });
    });

    it('VALID: {kind: "work-item-role-count", role: "pathseeker", minCount: 2} => parses to role-count assertion', () => {
      const result = WorkItemRoleCountAssertionStub();

      expect(result).toStrictEqual({
        kind: 'work-item-role-count',
        role: 'pathseeker',
        minCount: 2,
      });
    });

    it('VALID: {kind: "work-item-role-count", role: "spiritmender", minCount: 1} => parses to role-count assertion', () => {
      const result = WorkItemRoleCountAssertionStub({ role: 'spiritmender', minCount: 1 });

      expect(result).toStrictEqual({
        kind: 'work-item-role-count',
        role: 'spiritmender',
        minCount: 1,
      });
    });
  });

  describe('invalid assertions', () => {
    it('INVALID: {kind: "nonsense"} => throws validation error', () => {
      expect(() => {
        smoketestAssertionContract.parse({ kind: 'nonsense' as never, expected: 'complete' });
      }).toThrow(/Invalid discriminator value/u);
    });

    it('INVALID: {kind: "quest-status", expected: "not-a-status"} => throws validation error', () => {
      expect(() => {
        smoketestAssertionContract.parse({
          kind: 'quest-status',
          expected: 'not-a-status' as never,
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {kind: "work-item-status-histogram", expected: {complete: -1}} => throws for negative count', () => {
      expect(() => {
        smoketestAssertionContract.parse({
          kind: 'work-item-status-histogram',
          expected: { complete: -1 },
        });
      }).toThrow(/greater than or equal to 0/u);
    });

    it('INVALID: {kind: "work-item-status-histogram", expected: {complete: 1.5}} => throws for non-integer count', () => {
      expect(() => {
        smoketestAssertionContract.parse({
          kind: 'work-item-status-histogram',
          expected: { complete: 1.5 },
        });
      }).toThrow(/integer/u);
    });

    it('INVALID: {kind: "work-item-status-histogram", expected: {"bogus-status": 1}} => throws for unknown status key', () => {
      expect(() => {
        smoketestAssertionContract.parse({
          kind: 'work-item-status-histogram',
          expected: { 'bogus-status': 1 },
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {kind: "work-item-role-count", role: "bogus"} => throws for unknown role', () => {
      expect(() => {
        smoketestAssertionContract.parse({
          kind: 'work-item-role-count',
          role: 'bogus' as never,
          minCount: 1,
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {kind: "work-item-role-count", minCount: -1} => throws for negative minCount', () => {
      expect(() => {
        smoketestAssertionContract.parse({
          kind: 'work-item-role-count',
          role: 'pathseeker',
          minCount: -1,
        });
      }).toThrow(/greater than or equal to 0/u);
    });
  });
});
