import { claudeProjectPathEncoderTransformer } from './claude-project-path-encoder-transformer';
import { AbsoluteFilePathStub } from '../../contracts/absolute-file-path/absolute-file-path.stub';
import { SessionIdStub } from '../../contracts/session-id/session-id.stub';

describe('claudeProjectPathEncoderTransformer', () => {
  describe('path encoding', () => {
    it('VALID: {projectPath: "/home/user/my-project"} => encodes slashes to hyphens keeping leading hyphen', () => {
      const result = claudeProjectPathEncoderTransformer({
        homeDir: AbsoluteFilePathStub({ value: '/home/user' }),
        projectPath: AbsoluteFilePathStub({ value: '/home/user/my-project' }),
        sessionId: SessionIdStub({ value: 'abc-123' }),
      });

      expect(result).toBe('/home/user/.claude/projects/-home-user-my-project/abc-123.jsonl');
    });

    it('VALID: {projectPath: "/opt/code/repo"} => encodes deeply nested path', () => {
      const result = claudeProjectPathEncoderTransformer({
        homeDir: AbsoluteFilePathStub({ value: '/root' }),
        projectPath: AbsoluteFilePathStub({ value: '/opt/code/repo' }),
        sessionId: SessionIdStub({ value: 'session-456' }),
      });

      expect(result).toBe('/root/.claude/projects/-opt-code-repo/session-456.jsonl');
    });

    it('VALID: {projectPath: "/single"} => encodes single-level path', () => {
      const result = claudeProjectPathEncoderTransformer({
        homeDir: AbsoluteFilePathStub({ value: '/home/dev' }),
        projectPath: AbsoluteFilePathStub({ value: '/single' }),
        sessionId: SessionIdStub({ value: 'sess-1' }),
      });

      expect(result).toBe('/home/dev/.claude/projects/-single/sess-1.jsonl');
    });

    it('EDGE: {projectPath: "/a/b/c/d/e"} => encodes all slashes in deeply nested path', () => {
      const result = claudeProjectPathEncoderTransformer({
        homeDir: AbsoluteFilePathStub({ value: '/home/user' }),
        projectPath: AbsoluteFilePathStub({ value: '/a/b/c/d/e' }),
        sessionId: SessionIdStub({ value: 'deep-session' }),
      });

      expect(result).toBe('/home/user/.claude/projects/-a-b-c-d-e/deep-session.jsonl');
    });

    it('EDGE: {projectPath: "/home/u/repo/.claude/worktrees/x"} => keeps adjacent slash-then-dot hyphens uncollapsed', () => {
      const result = claudeProjectPathEncoderTransformer({
        homeDir: AbsoluteFilePathStub({ value: '/home/u' }),
        projectPath: AbsoluteFilePathStub({ value: '/home/u/repo/.claude/worktrees/x' }),
        sessionId: SessionIdStub({ value: 'sess-dot' }),
      });

      expect(result).toBe(
        '/home/u/.claude/projects/-home-u-repo--claude-worktrees-x/sess-dot.jsonl',
      );
    });

    it('VALID: {projectPath: "/home/user/.config/src"} => encodes a dotfile segment and a plain segment distinctly', () => {
      const result = claudeProjectPathEncoderTransformer({
        homeDir: AbsoluteFilePathStub({ value: '/home/user' }),
        projectPath: AbsoluteFilePathStub({ value: '/home/user/.config/src' }),
        sessionId: SessionIdStub({ value: 'sess-cfg' }),
      });

      expect(result).toBe('/home/user/.claude/projects/-home-user--config-src/sess-cfg.jsonl');
    });

    it('VALID: {projectPath: "/home/user/my_project (v2)"} => encodes underscores, spaces, and parens as hyphens', () => {
      const result = claudeProjectPathEncoderTransformer({
        homeDir: AbsoluteFilePathStub({ value: '/home/user' }),
        projectPath: AbsoluteFilePathStub({ value: '/home/user/my_project (v2)' }),
        sessionId: SessionIdStub({ value: 'sess-chars' }),
      });

      expect(result).toBe(
        '/home/user/.claude/projects/-home-user-my-project--v2-/sess-chars.jsonl',
      );
    });
  });
});
