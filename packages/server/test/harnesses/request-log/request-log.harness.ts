/**
 * PURPOSE: Turns the API server's request log on or off and captures what it writes to stdout,
 * for flow integration tests that assert the exact `[http]` line a real Hono request produces
 *
 * USAGE:
 * const requestLog = requestLogHarness();
 * requestLog.enable();
 * await app.request('/api/health');
 * requestLog.writtenLines(); // ['[http] info GET /api/health 200 Nms\n']
 */

import { deleteEnv, setEnv, stdout } from '#gateway/node/process';

type DevLogLine = string;

export const requestLogHarness = (): {
  beforeEach: () => void;
  afterEach: () => void;
  enable: () => void;
  disable: () => void;
  writtenLines: () => readonly DevLogLine[];
} => {
  const captured: DevLogLine[] = [];
  const saved: { write: typeof stdout.write | null } = { write: null };

  return {
    beforeEach: (): void => {
      captured.length = 0;
      deleteEnv('DUNGEONMASTER_REQUEST_LOG');
      saved.write = stdout.write;
      stdout.write = (chunk: Parameters<typeof stdout.write>[0]): boolean => {
        captured.push(String(chunk));
        return true;
      };
    },
    afterEach: (): void => {
      if (saved.write !== null) {
        stdout.write = saved.write;
      }
      deleteEnv('DUNGEONMASTER_REQUEST_LOG');
    },
    enable: (): void => {
      setEnv('DUNGEONMASTER_REQUEST_LOG', '1');
    },
    disable: (): void => {
      deleteEnv('DUNGEONMASTER_REQUEST_LOG');
    },
    // A real request's duration is wall-clock and varies run to run, so it reads back as `Nms`;
    // every other byte of the line is asserted exactly.
    writtenLines: (): readonly DevLogLine[] =>
      captured.map((line) => line.replace(/ \d+ms(?=:|\n)/u, ' Nms')),
  };
};
