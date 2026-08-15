import { RiftcarverDetailStub } from '../../contracts/riftcarver-detail/riftcarver-detail.stub';

import { riftcarverLogToDisplayLinesTransformer } from './riftcarver-log-to-display-lines-transformer';

describe('riftcarverLogToDisplayLinesTransformer', () => {
  describe('multi-line logs', () => {
    it('VALID: {log with trailing newline} => splits into lines without a trailing empty line', () => {
      const detail = RiftcarverDetailStub({ log: 'git worktree add\nnpm install\nbuild ok\n' });

      const result = riftcarverLogToDisplayLinesTransformer({ detail });

      expect(result).toStrictEqual(['git worktree add', 'npm install', 'build ok']);
    });

    it('VALID: {log without trailing newline} => keeps the final line', () => {
      const detail = RiftcarverDetailStub({ log: 'git worktree add\nbuild ok' });

      const result = riftcarverLogToDisplayLinesTransformer({ detail });

      expect(result).toStrictEqual(['git worktree add', 'build ok']);
    });

    it('VALID: {log with a blank line between steps} => preserves the blank line', () => {
      const detail = RiftcarverDetailStub({ log: '— git worktree add —\n\n— build pass 1 —\n' });

      const result = riftcarverLogToDisplayLinesTransformer({ detail });

      expect(result).toStrictEqual(['— git worktree add —', '', '— build pass 1 —']);
    });
  });

  describe('empty log', () => {
    it('EMPTY: {log: empty string} => returns empty array', () => {
      const detail = RiftcarverDetailStub({ log: '' });

      const result = riftcarverLogToDisplayLinesTransformer({ detail });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {unparseable detail} => returns empty array', () => {
      const result = riftcarverLogToDisplayLinesTransformer({ detail: 'not-an-object' });

      expect(result).toStrictEqual([]);
    });
  });
});
