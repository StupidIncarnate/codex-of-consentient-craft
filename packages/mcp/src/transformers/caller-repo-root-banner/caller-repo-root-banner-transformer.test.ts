
import { callerRepoRootBannerTransformer } from './caller-repo-root-banner-transformer';

describe('callerRepoRootBannerTransformer', () => {
  it('VALID: {source: caller-cwd, configFound: true} => renders the resolved root with no warning', () => {
    const repoRoot = '/repo/worktrees/siegelense';

    const result = callerRepoRootBannerTransformer({
      repoRoot,
      source: 'caller-cwd',
      configFound: true,
    });

    expect(result).toBe(
      "[project-root: /repo/worktrees/siegelense — resolved from the caller's own working directory]",
    );
  });

  it('EDGE: {source: server-cwd-fallback, configFound: true} => renders a WARNING naming the fallback root', () => {
    const repoRoot = '/repo/codex-of-consentient-craft';

    const result = callerRepoRootBannerTransformer({
      repoRoot,
      source: 'server-cwd-fallback',
      configFound: true,
    });

    expect(result).toBe(
      "[project-root: /repo/codex-of-consentient-craft — WARNING: the MCP call carried no caller context from the dungeonmaster-pre-mcp-caller hook (run `dungeonmaster init` to install it); falling back to the MCP server's own startup directory. If the caller is working in a worktree, this result may describe the WRONG tree.]",
    );
  });

  it('EDGE: {source: caller-cwd, configFound: false} => renders a WARNING that no config was found, even though the caller WAS identified', () => {
    const repoRoot = '/tmp/scratch-harness-dir';

    const result = callerRepoRootBannerTransformer({
      repoRoot,
      source: 'caller-cwd',
      configFound: false,
    });

    expect(result).toBe(
      "[project-root: /tmp/scratch-harness-dir — resolved from the caller's own working directory " +
        'WARNING: no .dungeonmaster.json was found anywhere above that path — this is the literal ' +
        'starting directory, not a confirmed dungeonmaster project root.]',
    );
  });

  it('EDGE: {source: server-cwd-fallback, configFound: false} => renders BOTH warnings', () => {
    const repoRoot = '/tmp/scratch-harness-dir';

    const result = callerRepoRootBannerTransformer({
      repoRoot,
      source: 'server-cwd-fallback',
      configFound: false,
    });

    expect(result).toBe(
      "[project-root: /tmp/scratch-harness-dir — WARNING: the MCP call carried no caller context from the dungeonmaster-pre-mcp-caller hook (run `dungeonmaster init` to install it); falling back to the MCP server's own startup directory. If the caller is working in a worktree, this result may describe the WRONG tree. WARNING: no .dungeonmaster.json was found anywhere above that path — this is the literal starting directory, not a confirmed dungeonmaster project root.]",
    );
  });
});
