import { ClaudeNotInstalledError } from '../claude-not-installed-error/claude-not-installed-error';
import { resolveClaudeCliPath } from './resolve-claude-cli-path';
import { resolveClaudeCliPathProxy } from './resolve-claude-cli-path.proxy';

describe('resolveClaudeCliPath()', () => {
  it('VALID: {CLAUDE_CLI_PATH set} => returns the override verbatim', () => {
    const proxy = resolveClaudeCliPathProxy();
    proxy.setupOverride({ cliPath: '/fake/bin/claude' });

    const result = resolveClaudeCliPath();

    expect(result).toBe('/fake/bin/claude');
  });

  it('VALID: {no override, npm package installed, bin is a string} => returns the joined absolute path', () => {
    const proxy = resolveClaudeCliPathProxy();
    proxy.setupNoOverride();
    proxy.setupNpmPackage({
      packageRoot: '/repo/node_modules/@anthropic-ai/claude-code',
      bin: 'cli.js',
    });

    const result = resolveClaudeCliPath();

    expect(result).toBe('/repo/node_modules/@anthropic-ai/claude-code/cli.js');
  });

  it('VALID: {no override, npm package installed, bin is an object} => returns the joined path of its first entry', () => {
    const proxy = resolveClaudeCliPathProxy();
    proxy.setupNoOverride();
    proxy.setupNpmPackage({
      packageRoot: '/repo/node_modules/@anthropic-ai/claude-code',
      bin: { claude: 'cli.js' },
    });

    const result = resolveClaudeCliPath();

    expect(result).toBe('/repo/node_modules/@anthropic-ai/claude-code/cli.js');
  });

  it('EDGE: {no override, npm package resolves but package.json is unreadable} => falls through to PATH', () => {
    const proxy = resolveClaudeCliPathProxy();
    proxy.setupNoOverride();
    proxy.setupPackageJsonMissing({ packageRoot: '/repo/node_modules/@anthropic-ai/claude-code' });
    proxy.setupPathScan({
      directories: ['/usr/bin', '/usr/local/bin'],
      foundInDirectory: '/usr/local/bin',
    });

    const result = resolveClaudeCliPath();

    expect(result).toBe('claude');
  });

  it('VALID: {no override, no npm package, claude found on PATH} => returns "claude"', () => {
    const proxy = resolveClaudeCliPathProxy();
    proxy.setupNoOverride();
    proxy.setupNoNpmPackage();
    proxy.setupPathScan({
      directories: ['/usr/bin', '/usr/local/bin'],
      foundInDirectory: '/usr/bin',
    });

    const result = resolveClaudeCliPath();

    expect(result).toBe('claude');
  });

  it('ERROR: {no override, no npm package, claude nowhere on PATH} => throws ClaudeNotInstalledError', () => {
    const proxy = resolveClaudeCliPathProxy();
    proxy.setupNoOverride();
    proxy.setupNoNpmPackage();
    proxy.setupPathScan({ directories: ['/usr/bin', '/usr/local/bin'] });

    expect(() => resolveClaudeCliPath()).toThrow(
      new ClaudeNotInstalledError(
        'Claude CLI not found: no CLAUDE_CLI_PATH override, no installed @anthropic-ai/claude-code package, and no claude binary on PATH',
      ),
    );
  });

  it('EMPTY: {no override, no npm package, PATH has no directories} => throws ClaudeNotInstalledError', () => {
    const proxy = resolveClaudeCliPathProxy();
    proxy.setupNoOverride();
    proxy.setupNoNpmPackage();
    proxy.setupPathScan({ directories: [] });

    expect(() => resolveClaudeCliPath()).toThrow(ClaudeNotInstalledError);
  });
});
