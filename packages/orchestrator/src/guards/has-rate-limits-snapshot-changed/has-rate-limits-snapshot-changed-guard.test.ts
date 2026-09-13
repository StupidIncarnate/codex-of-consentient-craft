import { RateLimitWindowStub, RateLimitsSnapshotStub } from '@dungeonmaster/shared/contracts';

import { hasRateLimitsSnapshotChangedGuard } from './has-rate-limits-snapshot-changed-guard';

describe('hasRateLimitsSnapshotChangedGuard', () => {
  describe('unchanged readings', () => {
    it('VALID: {identical snapshots} => returns false', () => {
      expect(
        hasRateLimitsSnapshotChangedGuard({
          previous: RateLimitsSnapshotStub(),
          next: RateLimitsSnapshotStub(),
        }),
      ).toBe(false);
    });

    it('VALID: {only updatedAt moved} => returns false, so a poll tick does not re-notify the browser', () => {
      expect(
        hasRateLimitsSnapshotChangedGuard({
          previous: RateLimitsSnapshotStub({ updatedAt: '2026-09-13T05:00:00.000Z' }),
          next: RateLimitsSnapshotStub({ updatedAt: '2026-09-13T05:00:05.000Z' }),
        }),
      ).toBe(false);
    });

    it('EMPTY: {both null} => returns false', () => {
      expect(hasRateLimitsSnapshotChangedGuard({ previous: null, next: null })).toBe(false);
    });

    it('EMPTY: {null vs a snapshot whose windows are both null} => returns false, because neither draws anything', () => {
      expect(
        hasRateLimitsSnapshotChangedGuard({
          previous: null,
          next: RateLimitsSnapshotStub({ fiveHour: null, sevenDay: null }),
        }),
      ).toBe(false);
    });

    it('EMPTY: {both windows null on each side} => returns false', () => {
      expect(
        hasRateLimitsSnapshotChangedGuard({
          previous: RateLimitsSnapshotStub({ fiveHour: null, sevenDay: null }),
          next: RateLimitsSnapshotStub({
            fiveHour: null,
            sevenDay: null,
            updatedAt: '2026-09-13T06:00:00.000Z',
          }),
        }),
      ).toBe(false);
    });
  });

  describe('changed readings', () => {
    it('VALID: {a five-hour percentage moved} => returns true', () => {
      expect(
        hasRateLimitsSnapshotChangedGuard({
          previous: RateLimitsSnapshotStub({
            fiveHour: RateLimitWindowStub({ usedPercentage: 42 }),
          }),
          next: RateLimitsSnapshotStub({
            fiveHour: RateLimitWindowStub({ usedPercentage: 81 }),
          }),
        }),
      ).toBe(true);
    });

    it('VALID: {a seven-day percentage moved} => returns true', () => {
      expect(
        hasRateLimitsSnapshotChangedGuard({
          previous: RateLimitsSnapshotStub({
            sevenDay: RateLimitWindowStub({ usedPercentage: 20 }),
          }),
          next: RateLimitsSnapshotStub({
            sevenDay: RateLimitWindowStub({ usedPercentage: 93 }),
          }),
        }),
      ).toBe(true);
    });

    it('VALID: {a reset time moved} => returns true, because the countdown on screen is wrong', () => {
      expect(
        hasRateLimitsSnapshotChangedGuard({
          previous: RateLimitsSnapshotStub({
            fiveHour: RateLimitWindowStub({ resetsAt: '2026-09-13T08:00:00.000Z' }),
          }),
          next: RateLimitsSnapshotStub({
            fiveHour: RateLimitWindowStub({ resetsAt: '2026-09-13T09:00:00.000Z' }),
          }),
        }),
      ).toBe(true);
    });

    it('VALID: {a window became calibrated} => returns true', () => {
      expect(
        hasRateLimitsSnapshotChangedGuard({
          previous: RateLimitsSnapshotStub({ fiveHour: null }),
          next: RateLimitsSnapshotStub({ fiveHour: RateLimitWindowStub() }),
        }),
      ).toBe(true);
    });

    it('EMPTY: {previous null, next a reading} => returns true, which is the first measurement landing', () => {
      expect(
        hasRateLimitsSnapshotChangedGuard({ previous: null, next: RateLimitsSnapshotStub() }),
      ).toBe(true);
    });

    it('EMPTY: {previous a reading, next null} => returns true', () => {
      expect(
        hasRateLimitsSnapshotChangedGuard({ previous: RateLimitsSnapshotStub(), next: null }),
      ).toBe(true);
    });

    it('VALID: {a reading replaced by an all-null snapshot} => returns true, because the cards must clear', () => {
      expect(
        hasRateLimitsSnapshotChangedGuard({
          previous: RateLimitsSnapshotStub(),
          next: RateLimitsSnapshotStub({ fiveHour: null, sevenDay: null }),
        }),
      ).toBe(true);
    });
  });

  describe('missing arguments', () => {
    it('EMPTY: {} => returns false, because nothing was compared', () => {
      expect(hasRateLimitsSnapshotChangedGuard({})).toBe(false);
    });
  });
});
