/**
 * PURPOSE: Provides port management helpers for kill-port adapter integration tests
 *
 * USAGE:
 * const harness = killPortHarness();
 * const port = await harness.getFreePort();
 * const server = harness.spawnServerOnPort({ port });
 * await harness.settle();
 * expect(harness.isPortInUse({ port })).toBe(true);
 */
import { execSync, spawn } from 'child_process';
import { createServer } from 'net';

import { NetworkPortStub } from '@dungeonmaster/shared/contracts';

const SETTLE_MS = 500;

export const killPortHarness = (): {
  getFreePort: () => Promise<ReturnType<typeof NetworkPortStub>>;
  isPortInUse: (params: { port: ReturnType<typeof NetworkPortStub> }) => boolean;
  spawnServerOnPort: (params: { port: ReturnType<typeof NetworkPortStub> }) => { kill: () => void };
  settle: () => Promise<void>;
} => {
  const getFreePort = async (): Promise<ReturnType<typeof NetworkPortStub>> =>
    new Promise((resolve, reject) => {
      const server = createServer();
      server.listen(0, () => {
        const address = server.address();
        if (typeof address === 'object' && address !== null) {
          const port = NetworkPortStub({ value: address.port });
          server.close(() => {
            resolve(port);
          });
        } else {
          reject(new Error('Failed to get port'));
        }
      });
    });

  const isPortInUse = ({ port }: { port: ReturnType<typeof NetworkPortStub> }): boolean => {
    try {
      const result = execSync(`lsof -ti :${String(port)} 2>/dev/null`, { encoding: 'utf-8' });
      return result.trim().length > 0;
    } catch {
      return false;
    }
  };

  const spawnServerOnPort = ({
    port,
  }: {
    port: ReturnType<typeof NetworkPortStub>;
  }): { kill: () => void } => {
    const child = spawn('node', ['-e', `require('net').createServer().listen(${String(port)})`], {
      stdio: 'ignore',
      detached: true,
    });
    child.unref();
    return {
      kill: (): void => {
        try {
          process.kill(child.pid ?? 0);
        } catch {
          /* already dead */
        }
      },
    };
  };

  const settle = async (): Promise<void> =>
    new Promise((resolve) => {
      setTimeout(resolve, SETTLE_MS);
    });

  return { getFreePort, isPortInUse, spawnServerOnPort, settle };
};
