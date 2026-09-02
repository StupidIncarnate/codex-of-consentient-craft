/**
 * PURPOSE: Provides test environment setup and helpers for server flow integration tests
 *
 * USAGE:
 * const server = serverAppHarness();
 * const restore = server.setupTestHome({ baseName: 'my-test' });
 * const body = server.toPlain(await response.json());
 * restore();
 */
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, writeFileSync, rmSync, chmodSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { FilePathStub, GuildNameStub, GuildPathStub } from '@dungeonmaster/shared/contracts';

// The real fake-Claude-CLI binary lives in the web package's own e2e harness (it records every
// invocation's argv to `invocations.jsonl` BEFORE it even reads its response queue — see that
// file's `recordInvocation`). Referencing its on-disk path here — not importing any code from
// packages/web — lets a server-flow integration test spawn the SAME controllable binary instead
// of risking a real `claude` process when CLAUDE_CLI_PATH is left unset.
const REAL_FAKE_CLAUDE_CLI_BIN = join(
  __dirname,
  '../../../../web/test/harnesses/claude-mock/bin/claude',
);

export const serverAppHarness = (): {
  setupTestHome: (params: { baseName: string }) => () => void;
  toPlain: (value: unknown) => unknown;
  seedQuest: (params: {
    dungeonmasterHome: string;
    guildId: string;
    questFolder: string;
    quest: unknown;
  }) => void;
  // Writes a REAL file to a fresh temp dir — a bytes-match-disk claim can't be settled against a
  // mocked read, so a test that serves an image over HTTP and diffs the response against the file
  // needs a genuine file on a genuine filesystem.
  seedImageFile: (params: { baseName: string; fileName: string; bytes: Uint8Array }) => {
    imagePath: FilePath;
    dirPath: FilePath;
    cleanup: () => void;
  };
  // Strips write permission from the quest's OWN directory (not the file — questPersistBroker
  // writes atomically via temp-file-then-rename, and a rename only needs write permission on the
  // DIRECTORY that holds both names, so chmod'ing quest.json itself would not stop the write).
  // Forces a REAL fs write failure so a 500 test proves the real HTTP status/body, not a mocked
  // adapter's stand-in. Call the returned `restore()` BEFORE `setupTestHome`'s own restore (which
  // recursively removes the temp dir and needs write permission on every directory in it).
  makeQuestDirectoryReadOnly: (params: {
    dungeonmasterHome: string;
    guildId: string;
    questFolder: string;
  }) => { restore: () => void };
  // Registers a REAL guild via the orchestrator package's own public API (the same one this
  // package's adapters call in production) so `guildGetBroker` — invoked deep inside
  // chatSpawnBroker when a comment-batch send resumes a chat session — can resolve it for real.
  // `seedQuest`'s glob-based quest lookup does not need this, but a real spawn does.
  registerRealGuild: (params: {
    name: string;
    path: string;
  }) => ReturnType<typeof StartOrchestrator.addGuild>;
  // Points CLAUDE_CLI_PATH at the real (working) fake-Claude-CLI binary and FAKE_CLAUDE_QUEUE_DIR
  // at a fresh, empty temp dir, so a caller that reaches a real spawn exercises a genuine OS
  // process under full control. Call `restore()` even when the test never reaches a spawn.
  configureFakeClaudeCli: () => { claudeQueueDir: FilePath; restore: () => void };
  // Polls for the fake CLI's `invocations.jsonl` ledger (one JSON line per spawn, written BEFORE
  // any queued response is read, recording the real `--resume <sessionId>` and `-p <prompt>`
  // argv) under `claudeQueueDir`, scoped by the spawn's `cwd`. Returns the last recorded
  // invocation, or `null` if none appeared before `timeoutMs` — the honest way to prove a REAL
  // spawn either happened with the right argv, or never happened at all.
  waitForClaudeInvocation: (params: {
    claudeQueueDir: FilePath;
    cwd: string;
    timeoutMs: number;
  }) => Promise<unknown>;
} => {
  const setupTestHome = ({ baseName }: { baseName: string }): (() => void) => {
    const savedDungeonmasterHome = process.env.DUNGEONMASTER_HOME;
    const tempDir = join(tmpdir(), `${baseName}-${randomUUID().slice(0, 8)}`);
    process.env.DUNGEONMASTER_HOME = tempDir;
    mkdirSync(tempDir, { recursive: true });
    writeFileSync(join(tempDir, 'config.json'), JSON.stringify({ guilds: [] }));

    return (): void => {
      if (savedDungeonmasterHome === undefined) {
        Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
      } else {
        process.env.DUNGEONMASTER_HOME = savedDungeonmasterHome;
      }
      rmSync(tempDir, { recursive: true, force: true });
    };
  };

  const toPlain = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

  // Writes a quest.json straight onto disk under an already-`setupTestHome`'d DUNGEONMASTER_HOME,
  // the same way mcp-server.harness.ts's seedQuest does for the MCP subprocess suite. The
  // orchestrator's quest lookup globs guilds/*/quests/*/quest.json — it does not require the
  // guild to be registered in config.json first.
  const seedQuest = ({
    dungeonmasterHome,
    guildId,
    questFolder,
    quest,
  }: {
    dungeonmasterHome: string;
    guildId: string;
    questFolder: string;
    quest: unknown;
  }): void => {
    const questDir = join(dungeonmasterHome, 'guilds', guildId, 'quests', questFolder);
    mkdirSync(questDir, { recursive: true });
    writeFileSync(join(questDir, 'quest.json'), JSON.stringify(quest, null, 2));
  };

  // Writes `bytes` to a real file under a fresh temp dir, the same shape `setupTestHome` uses, so
  // a test can serve it over HTTP and assert the response bytes equal the file's bytes on disk.
  // Hands back `dirPath` too, so a caller can build a path to a file that was never written, for
  // the missing-file case.
  const seedImageFile = ({
    baseName,
    fileName,
    bytes,
  }: {
    baseName: string;
    fileName: string;
    bytes: Uint8Array;
  }): { imagePath: FilePath; dirPath: FilePath; cleanup: () => void } => {
    const dirPath = join(tmpdir(), `${baseName}-${randomUUID().slice(0, 8)}`);
    mkdirSync(dirPath, { recursive: true });
    const imagePath = join(dirPath, fileName);
    writeFileSync(imagePath, bytes);

    return {
      imagePath: FilePathStub({ value: imagePath }),
      dirPath: FilePathStub({ value: dirPath }),
      cleanup: (): void => {
        rmSync(dirPath, { recursive: true, force: true });
      },
    };
  };

  const makeQuestDirectoryReadOnly = ({
    dungeonmasterHome,
    guildId,
    questFolder,
  }: {
    dungeonmasterHome: string;
    guildId: string;
    questFolder: string;
  }): { restore: () => void } => {
    const questDir = join(dungeonmasterHome, 'guilds', guildId, 'quests', questFolder);
    // r-xr-xr-x: read+list the existing quest.json, but no write — blocks creating the
    // temp file questPersistBroker's atomic write needs.
    chmodSync(questDir, 0o555);
    return {
      restore: (): void => {
        chmodSync(questDir, 0o755);
      },
    };
  };

  const registerRealGuild = async ({
    name,
    path,
  }: {
    name: string;
    path: string;
  }): ReturnType<typeof StartOrchestrator.addGuild> =>
    StartOrchestrator.addGuild({
      name: GuildNameStub({ value: name }),
      path: GuildPathStub({ value: path }),
    });

  const configureFakeClaudeCli = (): { claudeQueueDir: FilePath; restore: () => void } => {
    const claudeQueueDir = join(tmpdir(), `claude-queue-${randomUUID()}`);
    const savedCliPath = process.env.CLAUDE_CLI_PATH;
    const savedQueueDir = process.env.FAKE_CLAUDE_QUEUE_DIR;

    process.env.CLAUDE_CLI_PATH = REAL_FAKE_CLAUDE_CLI_BIN;
    process.env.FAKE_CLAUDE_QUEUE_DIR = claudeQueueDir;

    return {
      claudeQueueDir: FilePathStub({ value: claudeQueueDir }),
      restore: (): void => {
        if (savedCliPath === undefined) {
          Reflect.deleteProperty(process.env, 'CLAUDE_CLI_PATH');
        } else {
          process.env.CLAUDE_CLI_PATH = savedCliPath;
        }
        if (savedQueueDir === undefined) {
          Reflect.deleteProperty(process.env, 'FAKE_CLAUDE_QUEUE_DIR');
        } else {
          process.env.FAKE_CLAUDE_QUEUE_DIR = savedQueueDir;
        }
        rmSync(claudeQueueDir, { recursive: true, force: true });
      },
    };
  };

  // The mock CLI scopes its invocation ledger under `__by_cwd__/<encoded spawn cwd>/` (see
  // packages/web/test/harnesses/claude-mock/bin/claude) so parallel specs never collide. Encoding
  // is replicated verbatim (`[^A-Za-z0-9._-]` -> `_`) rather than imported, since the mock is a
  // plain Node script outside any package's public API.
  const encodeCwdForFakeCli = (cwd: string) => cwd.replace(/[^A-Za-z0-9._-]/gu, '_');

  // Returns `undefined` (not a thrown error) when the line is not yet valid JSON — the fake
  // CLI's append can be caught mid-write by `existsSync` below (file created, JSON line not
  // fully flushed), and treating that as "not ready yet" lets pollForInvocation retry instead
  // of the whole test crashing on a truncated-JSON parse error.
  const tryReadLastInvocation = (invocationsPath: string): unknown => {
    try {
      const lines = readFileSync(invocationsPath, 'utf-8').trim().split('\n');
      return JSON.parse(lines[lines.length - 1] ?? '{}') as unknown;
    } catch {
      return undefined;
    }
  };

  const pollForInvocation = async (params: {
    invocationsPath: string;
    deadline: number;
  }): Promise<unknown> => {
    const { invocationsPath, deadline } = params;
    const invocation = existsSync(invocationsPath)
      ? tryReadLastInvocation(invocationsPath)
      : undefined;
    if (invocation !== undefined) {
      return invocation;
    }
    if (Date.now() >= deadline) {
      return null;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    return pollForInvocation({ invocationsPath, deadline });
  };

  const waitForClaudeInvocation = async ({
    claudeQueueDir,
    cwd,
    timeoutMs,
  }: {
    claudeQueueDir: FilePath;
    cwd: string;
    timeoutMs: number;
  }): Promise<unknown> => {
    const invocationsPath = join(
      String(claudeQueueDir),
      '__by_cwd__',
      encodeCwdForFakeCli(cwd),
      'invocations.jsonl',
    );
    return pollForInvocation({ invocationsPath, deadline: Date.now() + timeoutMs });
  };

  return {
    setupTestHome,
    toPlain,
    seedQuest,
    seedImageFile,
    makeQuestDirectoryReadOnly,
    registerRealGuild,
    configureFakeClaudeCli,
    waitForClaudeInvocation,
  };
};
