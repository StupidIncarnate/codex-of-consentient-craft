import { DispatchHoldStub } from '@dungeonmaster/shared/contracts';

import { isDispatchHoldExpiredGuard } from './is-dispatch-hold-expired-guard';

const RESUME_AT = '2026-09-13T06:00:00.000Z';
const RESUME_AT_MS = Date.parse(RESUME_AT);

describe('isDispatchHoldExpiredGuard', () => {
  describe('live holds', () => {
    it('VALID: {now one second before resumeAt} => returns false', () => {
      const hold = DispatchHoldStub({ resumeAt: RESUME_AT });

      expect(isDispatchHoldExpiredGuard({ hold, nowMs: RESUME_AT_MS - 1000 })).toBe(false);
    });

    it('VALID: {now days before resumeAt} => returns false', () => {
      const hold = DispatchHoldStub({ resumeAt: '2026-09-20T06:00:00.000Z' });

      expect(isDispatchHoldExpiredGuard({ hold, nowMs: RESUME_AT_MS })).toBe(false);
    });
  });

  describe('expired holds', () => {
    it('EDGE: {now exactly at resumeAt} => returns true, because the boundary lifts the hold', () => {
      const hold = DispatchHoldStub({ resumeAt: RESUME_AT });

      expect(isDispatchHoldExpiredGuard({ hold, nowMs: RESUME_AT_MS })).toBe(true);
    });

    it('VALID: {now well past resumeAt} => returns true', () => {
      const hold = DispatchHoldStub({ resumeAt: RESUME_AT });

      expect(isDispatchHoldExpiredGuard({ hold, nowMs: RESUME_AT_MS + 86_400_000 })).toBe(true);
    });
  });

  describe('nothing to expire', () => {
    it('EMPTY: {hold: null} => returns false', () => {
      expect(isDispatchHoldExpiredGuard({ hold: null, nowMs: RESUME_AT_MS })).toBe(false);
    });

    it('EMPTY: {hold omitted} => returns false', () => {
      expect(isDispatchHoldExpiredGuard({ nowMs: RESUME_AT_MS })).toBe(false);
    });

    it('EMPTY: {nowMs omitted} => returns false', () => {
      expect(isDispatchHoldExpiredGuard({ hold: DispatchHoldStub() })).toBe(false);
    });

    it('EMPTY: {} => returns false', () => {
      expect(isDispatchHoldExpiredGuard({})).toBe(false);
    });
  });
});
