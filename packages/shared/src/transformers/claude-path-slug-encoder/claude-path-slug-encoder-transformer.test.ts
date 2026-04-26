import { claudePathSlugEncoderTransformer } from './claude-path-slug-encoder-transformer';
import { AbsoluteFilePathStub } from '../../contracts/absolute-file-path/absolute-file-path.stub';

describe('claudePathSlugEncoderTransformer', () => {
  describe('path encoding', () => {
    it('VALID: {projectPath: "/home/user/my-project"} => encodes slashes to hyphens keeping leading hyphen', () => {
      const result = claudePathSlugEncoderTransformer({
        homeDir: AbsoluteFilePathStub({ value: '/home/user' }),
        projectPath: AbsoluteFilePathStub({ value: '/home/user/my-project' }),
      });

      expect(result).toBe('/home/user/.claude/projects/-home-user-my-project');
    });

    it('VALID: {projectPath: "/opt/code/repo"} => encodes deeply nested path', () => {
      const result = claudePathSlugEncoderTransformer({
        homeDir: AbsoluteFilePathStub({ value: '/root' }),
        projectPath: AbsoluteFilePathStub({ value: '/opt/code/repo' }),
      });

      expect(result).toBe('/root/.claude/projects/-opt-code-repo');
    });

    it('VALID: {projectPath: "/single"} => encodes single-level path', () => {
      const result = claudePathSlugEncoderTransformer({
        homeDir: AbsoluteFilePathStub({ value: '/home/dev' }),
        projectPath: AbsoluteFilePathStub({ value: '/single' }),
      });

      expect(result).toBe('/home/dev/.claude/projects/-single');
    });

    it('EDGE: {projectPath: "/a/b/c/d/e"} => encodes all slashes in deeply nested path', () => {
      const result = claudePathSlugEncoderTransformer({
        homeDir: AbsoluteFilePathStub({ value: '/home/user' }),
        projectPath: AbsoluteFilePathStub({ value: '/a/b/c/d/e' }),
      });

      expect(result).toBe('/home/user/.claude/projects/-a-b-c-d-e');
    });
  });
});
