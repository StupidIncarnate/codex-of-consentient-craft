import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';

import { isSmoketestPollTerminalStatusGuard } from './is-smoketest-poll-terminal-status-guard';

describe('isSmoketestPollTerminalStatusGuard', () => {
  describe('terminal-for-polling statuses', () => {
    it('VALID: {status: complete} => returns true', () => {
      expect(isSmoketestPollTerminalStatusGuard({ status: 'complete' })).toBe(true);
    });

    it('VALID: {status: blocked} => returns true', () => {
      expect(isSmoketestPollTerminalStatusGuard({ status: 'blocked' })).toBe(true);
    });

    it('VALID: {status: abandoned} => returns true', () => {
      expect(isSmoketestPollTerminalStatusGuard({ status: 'abandoned' })).toBe(true);
    });
  });

  describe('non-terminal statuses (no workItems)', () => {
    it('VALID: {status: in_progress, no workItems} => returns false', () => {
      expect(isSmoketestPollTerminalStatusGuard({ status: 'in_progress' })).toBe(false);
    });

    it('VALID: {status: paused, no workItems} => returns false', () => {
      expect(isSmoketestPollTerminalStatusGuard({ status: 'paused' })).toBe(false);
    });

    it('VALID: {status: created, no workItems} => returns false', () => {
      expect(isSmoketestPollTerminalStatusGuard({ status: 'created' })).toBe(false);
    });
  });

  describe('workItems-terminal fallback', () => {
    it('VALID: {status: in_progress, all workItems terminal} => returns true', () => {
      const workItems = [
        WorkItemStub({
          id: 'aaaaaaa1-58cc-4372-a567-0e02b2c3d479',
          role: 'flowrider',
          status: 'complete',
        }),
        WorkItemStub({
          id: 'aaaaaaa2-58cc-4372-a567-0e02b2c3d479',
          role: 'codeweaver',
          status: 'failed',
        }),
        WorkItemStub({
          id: 'aaaaaaa3-58cc-4372-a567-0e02b2c3d479',
          role: 'siegemaster',
          status: 'skipped',
        }),
      ];

      expect(
        isSmoketestPollTerminalStatusGuard({
          status: 'in_progress',
          workItems,
        }),
      ).toBe(true);
    });

    it('VALID: {status: in_progress, one workItem still pending} => returns false', () => {
      const workItems = [
        WorkItemStub({
          id: 'bbbbbbb1-58cc-4372-a567-0e02b2c3d479',
          role: 'flowrider',
          status: 'complete',
        }),
        WorkItemStub({
          id: 'bbbbbbb2-58cc-4372-a567-0e02b2c3d479',
          role: 'codeweaver',
          status: 'pending',
        }),
      ];

      expect(
        isSmoketestPollTerminalStatusGuard({
          status: 'in_progress',
          workItems,
        }),
      ).toBe(false);
    });

    it('VALID: {status: in_progress, one workItem queued} => returns false', () => {
      const workItems = [
        WorkItemStub({
          id: 'ccccccc1-58cc-4372-a567-0e02b2c3d479',
          role: 'codeweaver',
          status: 'queued',
        }),
      ];

      expect(
        isSmoketestPollTerminalStatusGuard({
          status: 'in_progress',
          workItems,
        }),
      ).toBe(false);
    });

    it('VALID: {status: in_progress, empty workItems array} => returns false', () => {
      expect(
        isSmoketestPollTerminalStatusGuard({
          status: 'in_progress',
          workItems: [],
        }),
      ).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      expect(isSmoketestPollTerminalStatusGuard({})).toBe(false);
    });
  });
});
