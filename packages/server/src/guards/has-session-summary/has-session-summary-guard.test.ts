import { hasSessionSummaryGuard } from './has-session-summary-guard';
import { SessionSummaryStub } from '../../contracts/session-summary/session-summary.stub';

describe('hasSessionSummaryGuard', () => {
  describe('with summary', () => {
    it('VALID: {session with summary} => returns true', () => {
      const result = hasSessionSummaryGuard({ session: { summary: SessionSummaryStub() } });

      expect(result).toBe(true);
    });
  });

  describe('without summary', () => {
    it('VALID: {session without summary} => returns false', () => {
      const result = hasSessionSummaryGuard({ session: {} });

      expect(result).toBe(false);
    });
  });

  describe('without session', () => {
    it('EMPTY: {} => returns false', () => {
      const result = hasSessionSummaryGuard({});

      expect(result).toBe(false);
    });
  });
});
