import { IsoTimestampStub } from '../../contracts/iso-timestamp/iso-timestamp.stub';

import { isQuestUpdateStaleGuard } from './is-quest-update-stale-guard';

describe('isQuestUpdateStaleGuard', () => {
  describe('both timestamps present', () => {
    it('VALID: {incomingUpdatedAt later than lastAppliedUpdatedAt} => returns false', () => {
      const result = isQuestUpdateStaleGuard({
        incomingUpdatedAt: IsoTimestampStub({ value: '2026-01-01T09:00:12.000Z' }),
        lastAppliedUpdatedAt: IsoTimestampStub({ value: '2026-01-01T09:00:00.000Z' }),
      });

      expect(result).toBe(false);
    });

    it('VALID: {incomingUpdatedAt strictly earlier than lastAppliedUpdatedAt} => returns true, positively proven older', () => {
      const result = isQuestUpdateStaleGuard({
        incomingUpdatedAt: IsoTimestampStub({ value: '2026-01-01T09:00:00.000Z' }),
        lastAppliedUpdatedAt: IsoTimestampStub({ value: '2026-01-01T09:00:12.000Z' }),
      });

      expect(result).toBe(true);
    });

    it('EDGE: {incomingUpdatedAt equal to lastAppliedUpdatedAt} => returns false, a tie is not proof of staleness', () => {
      const result = isQuestUpdateStaleGuard({
        incomingUpdatedAt: IsoTimestampStub({ value: '2026-01-01T09:00:00.000Z' }),
        lastAppliedUpdatedAt: IsoTimestampStub({ value: '2026-01-01T09:00:00.000Z' }),
      });

      expect(result).toBe(false);
    });
  });

  describe('one timestamp missing', () => {
    it('EDGE: {incomingUpdatedAt: undefined, lastAppliedUpdatedAt present} => returns false, an undated frame cannot be proven stale', () => {
      const result = isQuestUpdateStaleGuard({
        lastAppliedUpdatedAt: IsoTimestampStub({ value: '2026-01-01T09:00:00.000Z' }),
      });

      expect(result).toBe(false);
    });

    it('EDGE: {incomingUpdatedAt present, lastAppliedUpdatedAt: undefined} => returns false, no baseline to prove it older than', () => {
      const result = isQuestUpdateStaleGuard({
        incomingUpdatedAt: IsoTimestampStub({ value: '2026-01-01T09:00:00.000Z' }),
      });

      expect(result).toBe(false);
    });
  });

  describe('both timestamps missing', () => {
    it('EMPTY: {incomingUpdatedAt: undefined, lastAppliedUpdatedAt: undefined} => returns false, applies rather than freezes', () => {
      const result = isQuestUpdateStaleGuard({});

      expect(result).toBe(false);
    });
  });
});
