/**
 * PURPOSE: Names the one failure `resolveClaudeCliPath` cannot recover from — no `CLAUDE_CLI_PATH`
 * override, no installed `@anthropic-ai/claude-code` npm package, and no `claude` binary anywhere
 * on `$PATH`. Thrown instead of handing a caller a bare `'claude'` string that only fails later,
 * deep inside a `spawn` ENOENT with nothing naming why.
 *
 * USAGE:
 * throw new ClaudeNotInstalledError('no CLAUDE_CLI_PATH, no @anthropic-ai/claude-code package, and no claude on PATH');
 */

export class ClaudeNotInstalledError extends Error {}
