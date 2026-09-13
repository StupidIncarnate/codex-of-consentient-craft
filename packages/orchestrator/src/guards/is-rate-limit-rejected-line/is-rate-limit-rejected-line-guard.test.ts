import { rateLimitRejectionStatics } from '../../statics/rate-limit-rejection/rate-limit-rejection-statics';

import { isRateLimitRejectedLineGuard } from './is-rate-limit-rejected-line-guard';

// Every line below is copied verbatim out of a real session transcript that a weekly-quota refusal
// killed mid-quest, so the guard is graded against the bytes Claude CLI actually writes.
const SYNTHETIC_ASSISTANT_JSONL =
  '{"type":"assistant","message":{"model":"<synthetic>","content":[{"type":"text","text":"You\'ve hit your weekly limit · resets Sep 12, 11pm (America/Los_Angeles)"}]},"error":"rate_limit","isApiErrorMessage":true,"apiErrorStatus":429}';
const TASK_NOTIFICATION_SUMMARY =
  'Agent "Round 2 verifier walks P2" failed: Agent terminated early due to an API error: You\'ve hit your weekly limit · resets Sep 12, 11pm (America/Los_Angeles) (error type rate_limit, HTTP 429, request id req_011Cew3n8gD2o3rJijc5Dvii, model sent to the API: claude-sonnet-5)';

describe('isRateLimitRejectedLineGuard', () => {
  describe('quota refusals', () => {
    it.each(rateLimitRejectionStatics.markers)(
      'VALID: {line containing %s} => returns true',
      (marker) => {
        expect(isRateLimitRejectedLineGuard({ line: `prefix ${marker} suffix` })).toBe(true);
      },
    );

    it('VALID: {the synthetic assistant JSONL line a refusal writes} => returns true', () => {
      expect(isRateLimitRejectedLineGuard({ line: SYNTHETIC_ASSISTANT_JSONL })).toBe(true);
    });

    it('VALID: {the task-notification summary a killed sub-agent produces} => returns true', () => {
      expect(isRateLimitRejectedLineGuard({ line: TASK_NOTIFICATION_SUMMARY })).toBe(true);
    });
  });

  describe('lines that are not refusals', () => {
    it('VALID: {an ordinary assistant line} => returns false', () => {
      expect(
        isRateLimitRejectedLineGuard({ line: '{"type":"assistant","message":{"content":[]}}' }),
      ).toBe(false);
    });

    it('VALID: {a 529 overload line} => returns false, so the overload path keeps that case', () => {
      expect(isRateLimitRejectedLineGuard({ line: 'API Error: 529 Overloaded.' })).toBe(false);
    });

    it('VALID: {a line merely mentioning rate limits in prose} => returns false', () => {
      expect(
        isRateLimitRejectedLineGuard({ line: 'Reading the rate limit statics file now' }),
      ).toBe(false);
    });

    it('EMPTY: {line: ""} => returns false', () => {
      expect(isRateLimitRejectedLineGuard({ line: '' })).toBe(false);
    });

    it('EMPTY: {} => returns false', () => {
      expect(isRateLimitRejectedLineGuard({})).toBe(false);
    });
  });
});
