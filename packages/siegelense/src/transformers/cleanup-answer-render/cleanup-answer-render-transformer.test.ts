import { CleanupAnswerStub } from '../../contracts/cleanup-answer/cleanup-answer.stub';

import { cleanupAnswerRenderTransformer } from './cleanup-answer-render-transformer';

describe('cleanupAnswerRenderTransformer', () => {
  describe('one reaped, two left alone', () => {
    it('VALID: {reaped, portsReleased, lockReleased, assetsAged, two leftAlone reasons} => the exact text including both reasons', () => {
      const answer = CleanupAnswerStub({
        reaped: [{ id: 'inst_9b2c', staleFor: '9h', killed: [33_812, 33_840], homeRemoved: true }],
        portsReleased: [41_345, 34_173],
        lockReleased: true,
        assetsAged: { instances: 3, freedMB: 1840 },
        leftAlone: [
          { id: 'inst_7f3a', why: 'live — last beat 2s ago' },
          { id: 'inst_1d09', why: 'reserved — booting, no beat yet' },
        ],
      });

      const result = cleanupAnswerRenderTransformer({ answer });

      expect(result).toBe(
        'REAPED: inst_9b2c (stale 9h, killed 33812, 33840, home removed)\n' +
          'PORTS RELEASED: 41345, 34173\n' +
          'LOCK RELEASED: yes\n' +
          'ASSETS AGED: 3 instances, 1840MB\n' +
          'LEFT ALONE: inst_7f3a (live — last beat 2s ago), inst_1d09 (reserved — booting, no beat yet)\n',
      );
    });
  });

  describe('nothing reaped and nothing left alone', () => {
    it('EMPTY: {reaped: [], portsReleased: [], lockReleased: false, nothing aged, leftAlone: []} => "none" fills every field, and the aged line prints its zero', () => {
      const answer = CleanupAnswerStub({
        reaped: [],
        portsReleased: [],
        lockReleased: false,
        assetsAged: { instances: 0, freedMB: 0 },
        leftAlone: [],
      });

      const result = cleanupAnswerRenderTransformer({ answer });

      expect(result).toBe(
        'REAPED: none\n' +
          'PORTS RELEASED: none\n' +
          'LOCK RELEASED: no\n' +
          'ASSETS AGED: 0 instances, 0MB\n' +
          'LEFT ALONE: none\n',
      );
    });
  });

  describe('a reaped instance with no pgids left to signal', () => {
    it('EDGE: {killed: [], homeRemoved: false} => "killed none" and "home kept"', () => {
      const answer = CleanupAnswerStub({
        reaped: [{ id: 'inst_dead0', staleFor: '3h', killed: [], homeRemoved: false }],
        portsReleased: [],
        lockReleased: true,
        assetsAged: { instances: 0, freedMB: 0 },
        leftAlone: [],
      });

      const result = cleanupAnswerRenderTransformer({ answer });

      expect(result).toBe(
        'REAPED: inst_dead0 (stale 3h, killed none, home kept)\n' +
          'PORTS RELEASED: none\n' +
          'LOCK RELEASED: yes\n' +
          'ASSETS AGED: 0 instances, 0MB\n' +
          'LEFT ALONE: none\n',
      );
    });
  });

  describe('an instance whose evidence a citation held back', () => {
    it("VALID: {leftAlone carrying a citation refusal} => the citing file reaches the operator's table verbatim", () => {
      const answer = CleanupAnswerStub({
        reaped: [],
        portsReleased: [],
        lockReleased: false,
        assetsAged: { instances: 1, freedMB: 12 },
        leftAlone: [
          {
            id: 'inst_1d09',
            why: 'run_7 cited by a VERIFIED prelude in /repo/.quest-plans/1dac5395/path-3.md',
          },
        ],
      });

      const result = cleanupAnswerRenderTransformer({ answer });

      expect(result).toBe(
        'REAPED: none\n' +
          'PORTS RELEASED: none\n' +
          'LOCK RELEASED: no\n' +
          'ASSETS AGED: 1 instances, 12MB\n' +
          'LEFT ALONE: inst_1d09 (run_7 cited by a VERIFIED prelude in /repo/.quest-plans/1dac5395/path-3.md)\n',
      );
    });
  });
});
