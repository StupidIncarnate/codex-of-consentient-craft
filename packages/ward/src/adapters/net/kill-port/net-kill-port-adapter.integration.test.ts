import { execSync, spawn } from 'child_process';
import { createServer } from 'net';

import { NetworkPortStub } from '@dungeonmaster/shared/contracts';

import { netKillPortAdapter } from './net-kill-port-adapter';

const SETTLE_MS = 500;

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

describe('netKillPortAdapter integration', () => {
  describe('kills active server', () => {
    it('VALID: {port with active child server} => kills process and frees port', async () => {
      const port = await getFreePort();
      const server = spawnServerOnPort({ port });
      await new Promise((r) => {
        setTimeout(r, SETTLE_MS);
      });

      expect(isPortInUse({ port })).toBe(true);

      await netKillPortAdapter({ port });
      await new Promise((r) => {
        setTimeout(r, SETTLE_MS);
      });

      server.kill();

      expect(isPortInUse({ port })).toBe(false);
    });
  });

  describe('no-op on free port', () => {
    it('EMPTY: {port with no listeners} => resolves without error', async () => {
      const port = await getFreePort();

      expect(isPortInUse({ port })).toBe(false);

      await netKillPortAdapter({ port });

      expect(isPortInUse({ port })).toBe(false);
    });
  });
});
