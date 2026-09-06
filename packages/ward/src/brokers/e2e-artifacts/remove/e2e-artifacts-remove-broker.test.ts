import { AbsoluteFilePathStub, NetworkPortStub } from '@dungeonmaster/shared/contracts';

import { e2eArtifactsRemoveBroker } from './e2e-artifacts-remove-broker';
import { e2eArtifactsRemoveBrokerProxy } from './e2e-artifacts-remove-broker.proxy';

describe('e2eArtifactsRemoveBroker', () => {
  describe('the cache this run created', () => {
    it('VALID: {packageRoot, port 40000} => removes node_modules/.vite-40000 recursively and forced', async () => {
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/packages/web' });
      const port = NetworkPortStub({ value: 40000 });
      const proxy = e2eArtifactsRemoveBrokerProxy();

      proxy.setupRemovable({ packageRoot, port: 40000 });

      await expect(e2eArtifactsRemoveBroker({ packageRoot, port })).resolves.toStrictEqual({
        success: true,
      });

      expect(proxy.getRemovedPaths({ packageRoot, port: 40000 })).toStrictEqual([
        ['/repo/packages/web/node_modules/.vite-40000', { recursive: true, force: true }],
      ]);
    });
  });

  describe('what it must leave alone', () => {
    // The traces of a failing run live in test-results/<port>, and they are the only record of why
    // it failed. This broker takes the cache and nothing else, so no pass/fail condition can be got
    // backwards and delete them. The age sweep retires them on the seven-day evidence window.
    it('VALID: {any run} => issues exactly one removal, so test-results is never touched', async () => {
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/packages/web' });
      const port = NetworkPortStub({ value: 40000 });
      const proxy = e2eArtifactsRemoveBrokerProxy();

      proxy.setupRemovable({ packageRoot, port: 40000 });

      await e2eArtifactsRemoveBroker({ packageRoot, port });

      expect(proxy.getRemovedPaths({ packageRoot, port: 40000 })).toStrictEqual([
        ['/repo/packages/web/node_modules/.vite-40000', { recursive: true, force: true }],
      ]);
    });
  });

  describe('a removal that fails', () => {
    // Reclaiming disk is worth nothing next to reporting a passing e2e run as a crash.
    it('ERROR: {rm throws EACCES} => still resolves success and does not rethrow', async () => {
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/packages/web' });
      const port = NetworkPortStub({ value: 40000 });
      const proxy = e2eArtifactsRemoveBrokerProxy();

      proxy.setupRemoveFails({ packageRoot, port: 40000 });

      await expect(e2eArtifactsRemoveBroker({ packageRoot, port })).resolves.toStrictEqual({
        success: true,
      });
    });
  });
});
