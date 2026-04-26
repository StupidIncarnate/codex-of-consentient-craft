/**
 * PURPOSE: Wraps ward mock queue helpers with lifecycle hooks for E2E tests
 *
 * USAGE:
 * const ward = wardMockHarness({ guildPath: GUILD_PATH });
 * // beforeEach: clears the cwd-scoped queue subdir + the root queue
 * ward.queueResponse({ response: wardResponseData });
 *
 * Per-cwd queue scoping prevents cross-test contamination: each test's responses live under
 * `${queueDir}/__by_cwd__/${encodedGuildPath}/`. The fake ward CLI computes the same path
 * from `process.cwd()` (which the orchestrator sets to the guild path on each spawn), so a
 * leftover orchestration loop from a prior test cannot consume responses meant for another.
 */
import * as fs from 'fs';
import * as path from 'path';

import type { WardQueueResponse } from '@dungeonmaster/shared/contracts';

import { fsQueueMetadataReadAdapter } from '../../../src/adapters/fs/queue-metadata-read/fs-queue-metadata-read-adapter';

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
  return path.join(home, 'ward-queue');
};

// Must match the encoding in the fake ward CLI so it finds the harness's queued files.
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

const queueWardResponse = ({
  queueDir,
  response,
}: {
  queueDir: string;
  response: WardQueueResponse;
}): void => {
  fs.mkdirSync(queueDir, { recursive: true });
  const counter = getCounter({ queueDir });
  const filePath = path.join(queueDir, `${String(counter).padStart(PAD_LENGTH, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(response));
  setCounter({ queueDir, counter: counter + 1 });
};

const clearWardQueue = ({ queueDir }: { queueDir: string }): void => {
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

export const wardMockHarness = ({
  guildPath,
}: {
  guildPath: string;
}): {
  beforeEach: () => void;
  queueResponse: (params: { response: WardQueueResponse }) => void;
  clearQueue: () => void;
} => ({
  beforeEach: (): void => {
    clearWardQueue({ queueDir: getRootQueueDir() });
    clearWardQueue({ queueDir: getScopedQueueDir({ guildPath }) });
  },
  queueResponse: ({ response }: { response: WardQueueResponse }): void => {
    queueWardResponse({ queueDir: getScopedQueueDir({ guildPath }), response });
  },
  clearQueue: (): void => {
    clearWardQueue({ queueDir: getRootQueueDir() });
    clearWardQueue({ queueDir: getScopedQueueDir({ guildPath }) });
  },
});
