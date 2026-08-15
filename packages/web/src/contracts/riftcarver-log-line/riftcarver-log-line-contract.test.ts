import { riftcarverLogLineContract } from './riftcarver-log-line-contract';
import { RiftcarverLogLineStub } from './riftcarver-log-line.stub';

describe('riftcarverLogLineContract', () => {
  describe('valid input', () => {
    it('VALID: {value: line string} => returns branded RiftcarverLogLine', () => {
      const result = riftcarverLogLineContract.parse('created worktree at /repo/worktrees/quest');

      expect(result).toBe('created worktree at /repo/worktrees/quest');
    });

    it('VALID: {stub default} => returns branded RiftcarverLogLine', () => {
      const result = RiftcarverLogLineStub();

      expect(result).toBe('— build pass 1 —');
    });

    it('EMPTY: {value: empty string} => returns branded empty RiftcarverLogLine', () => {
      const result = riftcarverLogLineContract.parse('');

      expect(result).toBe('');
    });
  });

  describe('invalid input', () => {
    it('INVALID: {value: number} => throws', () => {
      expect(() => riftcarverLogLineContract.parse(123 as never)).toThrow(/Expected string/u);
    });
  });
});
