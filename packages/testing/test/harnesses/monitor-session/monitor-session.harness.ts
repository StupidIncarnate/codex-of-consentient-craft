/**
 * PURPOSE: Writes/deletes the active-monitor-session.json file inside the e2e DUNGEONMASTER_HOME so the server's monitor-session-watch responder reacts and starts the orchestrator's JSONL watcher against the announced session. Mirrors what monitor-session-announce-broker does at MCP startup.
 *
 * USAGE:
 * const monitorSession = monitorSessionHarness();
 * monitorSession.announce({ parentSessionId, projectDir });
 * // afterEach: clears the announce file
 */
import * as fs from 'fs';
import * as path from 'path';

import type { FilePath } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

const ANNOUNCE_FILENAME = 'active-monitor-session.json';

const resolveAnnouncePath = (): FilePath => {
  const home = process.env.DUNGEONMASTER_HOME;
  if (typeof home !== 'string' || home === '') {
    throw new Error(
      'monitor-session harness: DUNGEONMASTER_HOME env var is not set in the e2e environment',
    );
  }
  return FilePathStub({ value: path.join(home, ANNOUNCE_FILENAME) });
};

export const monitorSessionHarness = (): {
  beforeEach: () => void;
  afterEach: () => void;
  announce: (params: { parentSessionId: string; projectDir: string }) => void;
  clearAnnounce: () => void;
} => ({
  beforeEach: (): void => {
    fs.rmSync(resolveAnnouncePath(), { force: true });
  },

  afterEach: (): void => {
    fs.rmSync(resolveAnnouncePath(), { force: true });
  },

  announce: ({
    parentSessionId,
    projectDir,
  }: {
    parentSessionId: string;
    projectDir: string;
  }): void => {
    const announcePath = resolveAnnouncePath();
    fs.mkdirSync(path.dirname(announcePath), { recursive: true });
    fs.writeFileSync(
      announcePath,
      JSON.stringify({
        parentSessionId,
        projectDir,
        registeredAt: new Date().toISOString(),
      }),
    );
  },

  clearAnnounce: (): void => {
    fs.rmSync(resolveAnnouncePath(), { force: true });
  },
});
