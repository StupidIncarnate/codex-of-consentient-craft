/**
 * PURPOSE: Wraps Claude CLI mock queue helpers with lifecycle hooks for E2E tests
 *
 * USAGE:
 * const claude = claudeMockHarness();
 * // beforeEach: clears queue
 * claude.queueResponse({ response: SimpleTextResponseStub() });
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

const getQueueDir = () => {
  const home = process.env.DUNGEONMASTER_HOME;
  if (!home) {
    throw new Error('DUNGEONMASTER_HOME env var is not set');
  }
  return path.join(home, 'claude-queue');
};

const getMetadataPath = () => path.join(getQueueDir(), 'metadata.json');

const getCounter = () => {
  const metaPath = getMetadataPath();
  if (fs.existsSync(metaPath)) {
    const raw = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    return Number(raw.counter);
  }
  return COUNTER_START;
};

const setCounter = (params: { counter: ReturnType<typeof getCounter> }): void => {
  fs.writeFileSync(getMetadataPath(), JSON.stringify(params));
};

const queueClaudeResponse = ({ response }: { response: ClaudeQueueResponse }): void => {
  const queueDir = getQueueDir();
  fs.mkdirSync(queueDir, { recursive: true });

  const counter = getCounter();
  const filePath = path.join(queueDir, `${String(counter).padStart(PAD_LENGTH, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(response));
  setCounter({ counter: counter + 1 });
};

const clearClaudeQueue = (): void => {
  const queueDir = getQueueDir();
  if (!fs.existsSync(queueDir)) {
    return;
  }

  const files = fs.readdirSync(queueDir);
  for (const file of files) {
    fs.unlinkSync(path.join(queueDir, file));
  }
};

// ── Harness ────────────────────────────────────────────────────────────────────

export const claudeMockHarness = (): {
  beforeEach: () => void;
  queueResponse: (params: { response: ClaudeQueueResponse }) => void;
  clearQueue: () => void;
} => ({
  beforeEach: (): void => {
    clearClaudeQueue();
  },
  queueResponse: ({ response }: { response: ClaudeQueueResponse }): void => {
    queueClaudeResponse({ response });
  },
  clearQueue: (): void => {
    clearClaudeQueue();
  },
});
