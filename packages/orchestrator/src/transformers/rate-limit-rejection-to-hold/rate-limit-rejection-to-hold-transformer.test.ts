import { rateLimitRejectionToHoldTransformer } from './rate-limit-rejection-to-hold-transformer';

const NOW_MS = Date.parse('2026-09-13T04:49:29.242Z');
// NOW_MS plus the 30-minute rejected wait.
const RESUME_AT = '2026-09-13T05:19:29.242Z';

// Copied verbatim from a session transcript a weekly-quota refusal killed mid-quest.
const WEEKLY_REFUSAL = "You've hit your weekly limit · resets Sep 12, 11pm (America/Los_Angeles)";

describe('rateLimitRejectionToHoldTransformer', () => {
  describe('window named in the refusal', () => {
    it('VALID: {the real weekly refusal line} => holds on the seven-day window', () => {
      const result = rateLimitRejectionToHoldTransformer({ line: WEEKLY_REFUSAL, nowMs: NOW_MS });

      expect(result).toStrictEqual({
        reason: 'rejected',
        window: 'seven-day',
        detail: 'the API refused a request on the 7d window — dispatch holds, then retries',
        heldAt: '2026-09-13T04:49:29.242Z',
        resumeAt: RESUME_AT,
      });
    });

    it('VALID: {a 5-hour refusal line} => holds on the five-hour window', () => {
      const result = rateLimitRejectionToHoldTransformer({
        line: "You've hit your 5-hour limit · resets 3pm",
        nowMs: NOW_MS,
      });

      expect(result).toStrictEqual({
        reason: 'rejected',
        window: 'five-hour',
        detail: 'the API refused a request on the 5h window — dispatch holds, then retries',
        heldAt: '2026-09-13T04:49:29.242Z',
        resumeAt: RESUME_AT,
      });
    });
  });

  describe('window absent from the refusal', () => {
    it('EDGE: {a bare 429 naming no window} => falls back to five-hour, the shorter wait', () => {
      const result = rateLimitRejectionToHoldTransformer({
        line: 'API Error: 429',
        nowMs: NOW_MS,
      });

      expect(result).toStrictEqual({
        reason: 'rejected',
        window: 'five-hour',
        detail: 'the API refused a request on the 5h window — dispatch holds, then retries',
        heldAt: '2026-09-13T04:49:29.242Z',
        resumeAt: RESUME_AT,
      });
    });

    it('EMPTY: {line: ""} => still produces a five-hour hold rather than throwing', () => {
      const result = rateLimitRejectionToHoldTransformer({ line: '', nowMs: NOW_MS });

      expect(result).toStrictEqual({
        reason: 'rejected',
        window: 'five-hour',
        detail: 'the API refused a request on the 5h window — dispatch holds, then retries',
        heldAt: '2026-09-13T04:49:29.242Z',
        resumeAt: RESUME_AT,
      });
    });
  });
});
