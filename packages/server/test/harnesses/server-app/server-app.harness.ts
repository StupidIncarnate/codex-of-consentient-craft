/**
 * PURPOSE: Provides test environment setup and helpers for server flow integration tests
 *
 * USAGE:
 * const server = serverAppHarness();
 * const restore = server.setupTestHome({ baseName: 'my-test' });
 * const body = server.toPlain(await response.json());
 * restore();
 */
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';

import { environmentStatics } from '@dungeonmaster/shared/statics';

export const serverAppHarness = (): {
  setupTestHome: (params: { baseName: string }) => () => void;
  toPlain: (value: unknown) => unknown;
} => {
  const setupTestHome = ({ baseName }: { baseName: string }): (() => void) => {
    const savedDungeonmasterHome = process.env.DUNGEONMASTER_HOME;
    const tempDir = join(tmpdir(), `${baseName}-${randomUUID().slice(0, 8)}`);
    process.env.DUNGEONMASTER_HOME = tempDir;
    const dmDir = join(tempDir, environmentStatics.testDataDir);
    mkdirSync(dmDir, { recursive: true });
    writeFileSync(join(dmDir, 'config.json'), JSON.stringify({ guilds: [] }));

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

  return {
    setupTestHome,
    toPlain,
  };
};
