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
  });
});
