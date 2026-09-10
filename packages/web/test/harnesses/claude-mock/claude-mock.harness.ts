/**
 * PURPOSE: Wraps Claude CLI mock queue helpers with lifecycle hooks for E2E tests
 *
 * USAGE:
 * const claude = claudeMockHarness({ guildPath: GUILD_PATH });
 * // beforeEach: clears the cwd-scoped queue subdir + the root queue
 * claude.queueResponse({ response: SimpleTextResponseStub() });
 *
 * Per-cwd queue scoping prevents cross-test contamination: each test's responses live under
 * `${queueDir}/__by_cwd__/${encodedGuildPath}/`. The fake Claude CLI computes the same path
 * from `process.cwd()` (which the orchestrator sets to the guild path on each spawn), so a
 * leftover orchestration loop from a prior test cannot consume responses meant for another.
 */
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

import type { ClaudeQueueResponse } from '@dungeonmaster/shared/contracts';

import { fsQueueMetadataReadAdapter } from '@dungeonmaster/testing/adapters/fs/queue-metadata-read';

// One record per fake-CLI spawn, written by `bin/claude`. `resumeSessionId` is the value the
// orchestrator passed after `--resume` (null on a fresh spawn) — the only observable proof of
// whether a dispatch resumed a retained session or clobbered it, since a fresh child stamps a new
// sessionId over the old one and quest.json ends up looking the same either way.
const claudeInvocationContract = z.object({
  resumeSessionId: z.string().brand<'SessionId'>().nullable(),
  prompt: z.string().brand<'PromptText'>().nullable(),
});

type ClaudeInvocation = z.infer<typeof claudeInvocationContract>;

const INVOCATIONS_FILE = 'invocations.jsonl';

export {
  ClaudeQueueResponseStub,
  SimpleTextResponseStub,
  ToolUseChainResponseStub,
  ErrorResponseStub,
  ResumeResponseStub,
  ClarificationResponseStub,
} from '@dungeonmaster/shared/contracts';

// ── Queue helpers ──────────────────────────────────────────────────────────────

const COUNTER_START = 0;
const PAD_LENGTH = 4;
const ENCODE_NON_SAFE = /[^A-Za-z0-9._-]/gu;
const SCOPE_REPLACEMENT = '_';

const getRootQueueDir = () => {
  const home = process.env.DUNGEONMASTER_HOME;
  if (!home) {
    throw new Error('DUNGEONMASTER_HOME env var is not set');
  }
  return path.join(home, 'claude-queue');
};

// Must match the encoding in `bin/claude` so the CLI finds the harness's queued files.
const encodeCwdScope = ({ cwd }: { cwd: string }) =>
  cwd.replace(ENCODE_NON_SAFE, SCOPE_REPLACEMENT);

const getScopedQueueDir = ({ guildPath }: { guildPath: string }) =>
  path.join(getRootQueueDir(), '__by_cwd__', encodeCwdScope({ cwd: guildPath }));

const getMetadataPath = ({ queueDir }: { queueDir: string }) =>
  path.join(queueDir, 'metadata.json');

const getCounter = ({ queueDir }: { queueDir: string }) => {
  const metaPath = getMetadataPath({ queueDir });
  if (fs.existsSync(metaPath)) {
    return fsQueueMetadataReadAdapter({ metadataPath: metaPath }).counter;
  }
  return COUNTER_START;
};

const setCounter = ({
  queueDir,
  counter,
}: {
  queueDir: string;
  counter: ReturnType<typeof getCounter>;
}): void => {
  fs.writeFileSync(getMetadataPath({ queueDir }), JSON.stringify({ counter }));
};

const queueClaudeResponse = ({
  queueDir,
  response,
}: {
  queueDir: string;
  response: ClaudeQueueResponse;
}): void => {
  fs.mkdirSync(queueDir, { recursive: true });
  const counter = getCounter({ queueDir });
  const filePath = path.join(queueDir, `${String(counter).padStart(PAD_LENGTH, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(response));
  setCounter({ queueDir, counter: counter + 1 });
};

const clearClaudeQueue = ({ queueDir }: { queueDir: string }): void => {
  if (!fs.existsSync(queueDir)) {
    return;
  }

  const files = fs.readdirSync(queueDir);
  for (const file of files) {
    const full = path.join(queueDir, file);
    if (fs.statSync(full).isFile()) {
      fs.unlinkSync(full);
    }
  }
};

// ── Harness ────────────────────────────────────────────────────────────────────

export const claudeMockHarness = ({
  guildPath,
  agentCwd,
}: {
  guildPath: string;
  // WHERE THE FAKE CLI WILL ACTUALLY RUN, when that is not the guild path. The queue is scoped by
  // the spawned child's own `process.cwd()`, and the orchestrator sets that to the quest's cwd — so
  // once a quest is CARVED, every agent after riftcarver runs in the WORKTREE and looks for its
  // queued response under the worktree's encoding, not the guild's. A spec covering anything past
  // the carve has to say so here, or its response is queued somewhere the child never looks and the
  // spawn dies red-on-empty. Defaults to the guild path, which is where an uncarved quest runs.
  agentCwd?: string;
}): {
  beforeEach: () => void;
  queueResponse: (params: { response: ClaudeQueueResponse }) => void;
  clearQueue: () => void;
  readInvocations: () => readonly ClaudeInvocation[];
} => {
  const spawnCwd = agentCwd ?? guildPath;

  // Both scopes are cleared whether or not they differ, so a spec that carves does not inherit a
  // response an earlier uncarved spec left under the guild scope.
  const clearAllScopes = (): void => {
    clearClaudeQueue({ queueDir: getRootQueueDir() });
    clearClaudeQueue({ queueDir: getScopedQueueDir({ guildPath }) });
    clearClaudeQueue({ queueDir: getScopedQueueDir({ guildPath: spawnCwd }) });
  };

  return {
    // Clear the root queue (legacy unscoped responses) and every cwd-scoped subdir this harness
    // can write to. Prevents leftover responses from prior tests being consumed by this test's
    // spawns.
    beforeEach: clearAllScopes,
    queueResponse: ({ response }: { response: ClaudeQueueResponse }): void => {
      queueClaudeResponse({ queueDir: getScopedQueueDir({ guildPath: spawnCwd }), response });
    },
    clearQueue: clearAllScopes,
    readInvocations: (): readonly ClaudeInvocation[] => {
      const invocationsPath = path.join(
        getScopedQueueDir({ guildPath: spawnCwd }),
        INVOCATIONS_FILE,
      );
      if (!fs.existsSync(invocationsPath)) {
        return [];
      }
      return fs
        .readFileSync(invocationsPath, 'utf8')
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .map((line) => claudeInvocationContract.parse(JSON.parse(line)));
    },
  };
};
