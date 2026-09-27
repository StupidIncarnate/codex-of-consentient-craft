/**
 * PURPOSE: Locates the Claude CLI in resolution-precedence order — an explicit `CLAUDE_CLI_PATH`
 * override first (what every test and e2e harness points at a fake CLI binary), then the
 * installed `@anthropic-ai/claude-code` npm package's own `bin` entry, then a bare `claude`
 * confirmed present on `$PATH`. Reach for this over hardcoding
 * `process.env.CLAUDE_CLI_PATH ?? 'claude'` at a spawn site — that shortcut never resolves the npm
 * package and never distinguishes "nothing resolved anywhere" from "PATH might have it", which is
 * how a missing CLI used to surface as a bare ENOENT deep inside `spawn` instead of a message
 * naming what was tried.
 *
 * USAGE:
 * const cliPath = resolveClaudeCliPath();
 * // Returns an absolute path (npm package bin) or 'claude' (confirmed on PATH); throws
 * // ClaudeNotInstalledError when none of the three resolves
 */

import { existsSync, readJsonFileSyncIfExists } from '#gateway/node/fs';
import { resolvePackageRoot } from '#gateway/node/module';
import path from '#gateway/node/path';
import { getEnv } from '#gateway/node/process';

import { ClaudeNotInstalledError } from './claude-not-installed.error';

const ANTHROPIC_PACKAGE_SPECIFIER = '@anthropic-ai/claude-code';
const CLAUDE_BINARY_NAME = 'claude';

// One function, no non-exported helpers (forbid-non-exported-functions) — each resolution step
// is inlined as its own guarded block instead of a private function, matching the rest of this
// gateway's flat-file convention of one file, one export.
export const resolveClaudeCliPath = (): string => {
  const override = getEnv('CLAUDE_CLI_PATH');
  if (override !== undefined) {
    return override;
  }

  const packageRoot = resolvePackageRoot({ specifier: ANTHROPIC_PACKAGE_SPECIFIER });
  if (packageRoot !== null) {
    const packageJson = readJsonFileSyncIfExists(path.join(packageRoot, 'package.json'));
    if (typeof packageJson === 'object' && packageJson !== null) {
      const { bin } = packageJson as { bin?: unknown };
      const binValues =
        typeof bin === 'object' && bin !== null
          ? Object.values(bin as Record<string, unknown>)
          : [];
      const binPath =
        typeof bin === 'string' ? bin : binValues.find((value) => typeof value === 'string');

      if (typeof binPath === 'string') {
        return path.join(packageRoot, binPath);
      }
    }
  }

  const pathEnv = getEnv('PATH') ?? '';
  const directories = pathEnv.split(path.delimiter).filter((directory) => directory.length > 0);
  const foundOnPath = directories.some((directory) =>
    existsSync(path.join(directory, CLAUDE_BINARY_NAME)),
  );

  if (foundOnPath) {
    return CLAUDE_BINARY_NAME;
  }

  throw new ClaudeNotInstalledError(
    'Claude CLI not found: no CLAUDE_CLI_PATH override, no installed @anthropic-ai/claude-code package, and no claude binary on PATH',
  );
};
