import { claudePathSlugEncoderTransformer } from './claude-path-slug-encoder-transformer';

describe('claudePathSlugEncoderTransformer', () => {
  describe('path encoding', () => {
    it('VALID: {projectPath: "/home/user/my-project"} => encodes slashes to hyphens keeping leading hyphen', () => {
      const result = claudePathSlugEncoderTransformer({
        homeDir: '/home/user',
        projectPath: '/home/user/my-project',
      });

      expect(result).toBe('/home/user/.claude/projects/-home-user-my-project');
    });

    it('VALID: {projectPath: "/opt/code/repo"} => encodes deeply nested path', () => {
      const result = claudePathSlugEncoderTransformer({
        homeDir: '/root',
        projectPath: '/opt/code/repo',
      });

      expect(result).toBe('/root/.claude/projects/-opt-code-repo');
    });

    it('VALID: {projectPath: "/single"} => encodes single-level path', () => {
      const result = claudePathSlugEncoderTransformer({
        homeDir: '/home/dev',
        projectPath: '/single',
      });

      expect(result).toBe('/home/dev/.claude/projects/-single');
    });

    it('EDGE: {projectPath: "/a/b/c/d/e"} => encodes all slashes in deeply nested path', () => {
      const result = claudePathSlugEncoderTransformer({
        homeDir: '/home/user',
        projectPath: '/a/b/c/d/e',
      });

      expect(result).toBe('/home/user/.claude/projects/-a-b-c-d-e');
    });

    it('EDGE: {projectPath: "/home/u/repo/.claude/worktrees/x"} => keeps adjacent slash-then-dot hyphens uncollapsed', () => {
      const result = claudePathSlugEncoderTransformer({
        homeDir: '/home/u',
        projectPath: '/home/u/repo/.claude/worktrees/x',
      });

      expect(result).toBe('/home/u/.claude/projects/-home-u-repo--claude-worktrees-x');
    });

    it('VALID: {projectPath: "/home/user/.config/src"} => encodes a dotfile segment and a plain segment distinctly', () => {
      const result = claudePathSlugEncoderTransformer({
        homeDir: '/home/user',
        projectPath: '/home/user/.config/src',
      });

      expect(result).toBe('/home/user/.claude/projects/-home-user--config-src');
    });

    it('VALID: {projectPath: "/home/user/my_project (v2)"} => encodes underscores, spaces, and parens as hyphens', () => {
      const result = claudePathSlugEncoderTransformer({
        homeDir: '/home/user',
        projectPath: '/home/user/my_project (v2)',
      });

      expect(result).toBe('/home/user/.claude/projects/-home-user-my-project--v2-');
    });
  });
});
