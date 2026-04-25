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

import type { ClaudeQueueResponse } from '@dungeonmaster/shared/contracts';

export {
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
    const raw = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    return Number(raw.counter);
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
}: {
  guildPath: string;
}): {
  beforeEach: () => void;
  queueResponse: (params: { response: ClaudeQueueResponse }) => void;
  clearQueue: () => void;
} => ({
  beforeEach: (): void => {
    // Clear both the root queue (legacy unscoped responses) and this test's cwd-scoped subdir.
    // Prevents leftover responses from prior tests from being consumed by this test's spawns.
    clearClaudeQueue({ queueDir: getRootQueueDir() });
    clearClaudeQueue({ queueDir: getScopedQueueDir({ guildPath }) });
  },
  queueResponse: ({ response }: { response: ClaudeQueueResponse }): void => {
    queueClaudeResponse({ queueDir: getScopedQueueDir({ guildPath }), response });
  },
  clearQueue: (): void => {
    clearClaudeQueue({ queueDir: getRootQueueDir() });
    clearClaudeQueue({ queueDir: getScopedQueueDir({ guildPath }) });
  },
});
