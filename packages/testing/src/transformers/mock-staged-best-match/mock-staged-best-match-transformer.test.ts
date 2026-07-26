import { StagedCallStub } from '../../contracts/staged-call/staged-call.stub';
import { mockStagedBestMatchTransformer } from './mock-staged-best-match-transformer';

describe('mockStagedBestMatchTransformer', () => {
  describe('empty staging', () => {
    it('EMPTY: {staged: []} => returns undefined', () => {
      expect(mockStagedBestMatchTransformer({ staged: [], actual: ['/a/quest.json'] })).toBe(
        undefined,
      );
    });
  });

  describe('specificity', () => {
    it('VALID: {two candidates, second more specific} => returns the more specific candidate', () => {
      const patternOnly = StagedCallStub({ args: ['src/**'] });
      const patternAndOptions = StagedCallStub({ args: ['src/**', { nodir: true }] });

      const winner = mockStagedBestMatchTransformer({
        staged: [patternOnly, patternAndOptions],
        actual: ['src/**', { nodir: true, cwd: '/x' }],
      });

      expect(winner).toBe(patternAndOptions);
    });

    it('VALID: {equal specificity} => returns the later-written candidate', () => {
      const first = StagedCallStub({ args: ['/a/quest.json'] });
      const second = StagedCallStub({ args: ['/a/quest.json'] });

      const winner = mockStagedBestMatchTransformer({
        staged: [first, second],
        actual: ['/a/quest.json'],
      });

      expect(winner).toBe(second);
    });
  });

  describe('once vs sticky', () => {
    it('VALID: {sticky written first, live once written second} => once wins', () => {
      const sticky = StagedCallStub({ args: ['/a/quest.json'], once: false });
      const liveOnce = StagedCallStub({ args: ['/a/quest.json'], once: true, consumed: false });

      const winner = mockStagedBestMatchTransformer({
        staged: [sticky, liveOnce],
        actual: ['/a/quest.json'],
      });

      expect(winner).toBe(liveOnce);
    });

    it('VALID: {consumed once, sticky same args} => consumed once is skipped, sticky wins', () => {
      const consumedOnce = StagedCallStub({ args: ['/a/quest.json'], once: true, consumed: true });
      const sticky = StagedCallStub({ args: ['/a/quest.json'], once: false });

      const winner = mockStagedBestMatchTransformer({
        staged: [consumedOnce, sticky],
        actual: ['/a/quest.json'],
      });

      expect(winner).toBe(sticky);
    });

    it('EDGE: {only a consumed once staged} => returns undefined', () => {
      const consumedOnce = StagedCallStub({ args: ['/a/quest.json'], once: true, consumed: true });

      const winner = mockStagedBestMatchTransformer({
        staged: [consumedOnce],
        actual: ['/a/quest.json'],
      });

      expect(winner).toBe(undefined);
    });
  });

  describe('non-matching staging', () => {
    it('INVALID: {staged args do not match actual} => returns undefined', () => {
      const record = StagedCallStub({ args: ['/a/quest.json'] });

      const winner = mockStagedBestMatchTransformer({
        staged: [record],
        actual: ['/a/other.json'],
      });

      expect(winner).toBe(undefined);
    });
  });
});
