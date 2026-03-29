import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { devServerStartBroker } from './dev-server-start-broker';
import { devServerStartBrokerProxy } from './dev-server-start-broker.proxy';

describe('devServerStartBroker', () => {
  describe('server becomes ready', () => {
    it('VALID: {server starts and responds 200} => returns expected url', async () => {
      const proxy = devServerStartBrokerProxy();
      proxy.setupServerBecomesReady();

      const result = await devServerStartBroker({
        devCommand: 'npm run dev',
        port: 3000,
        hostname: 'localhost',
        readinessPath: '/',
        readinessTimeoutMs: 30000,
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result.url).toBe('http://localhost:3000');
    });
  });

  describe('empty dev command', () => {
    it('ERROR: {empty devCommand} => throws dev command is empty', async () => {
      const proxy = devServerStartBrokerProxy();
      proxy.setupServerBecomesReady();

      await expect(
        devServerStartBroker({
          devCommand: '',
          port: 3000,
          hostname: 'localhost',
          readinessPath: '/',
          readinessTimeoutMs: 30000,
          cwd: AbsoluteFilePathStub({ value: '/project' }),
        }),
      ).rejects.toThrow(/Dev command is empty/u);
    });
  });

  describe('server exits before ready', () => {
    it('ERROR: {process exits with code 1 before ready} => throws process exited error', async () => {
      const proxy = devServerStartBrokerProxy();
      proxy.setupServerExitsBeforeReady({ exitCode: 1 });

      await expect(
        devServerStartBroker({
          devCommand: 'npm run dev',
          port: 3000,
          hostname: 'localhost',
          readinessPath: '/',
          readinessTimeoutMs: 30000,
          cwd: AbsoluteFilePathStub({ value: '/project' }),
        }),
      ).rejects.toThrow(/Dev server process exited before becoming ready/u);
    });
  });

  describe('server readiness timeout', () => {
    it('ERROR: {server never becomes ready, timeout 0ms} => throws timeout error', async () => {
      const proxy = devServerStartBrokerProxy();
      proxy.setupServerReadinessTimeout();

      await expect(
        devServerStartBroker({
          devCommand: 'npm run dev',
          port: 3000,
          hostname: 'localhost',
          readinessPath: '/health',
          readinessTimeoutMs: 0,
          cwd: AbsoluteFilePathStub({ value: '/project' }),
        }),
      ).rejects.toThrow(/Dev server did not become ready within/u);
    });
  });

  describe('port cleanup before start', () => {
    it('VALID: {server starts successfully} => kills stale processes on both server port and web port before spawning', async () => {
      const proxy = devServerStartBrokerProxy();
      proxy.setupServerBecomesReady();

      await devServerStartBroker({
        devCommand: 'npm run dev',
        port: 3000,
        hostname: 'localhost',
        readinessPath: '/',
        readinessTimeoutMs: 30000,
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(proxy.wasKillByPortCalledForBothPorts()).toBe(true);
    });
  });
});
