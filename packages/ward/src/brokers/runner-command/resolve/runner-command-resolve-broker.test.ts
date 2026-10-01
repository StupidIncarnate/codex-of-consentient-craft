import { execPath } from '#gateway/node/process';

import { runnerCommandResolveBroker } from './runner-command-resolve-broker';
import { runnerCommandResolveBrokerProxy } from './runner-command-resolve-broker.proxy';

describe('runnerCommandResolveBroker', () => {
  describe('the source condition is supported', () => {
    it('VALID: {binName: "jest", shared source barrel reachable} => runs the bin through this node with --conditions=source', () => {
      const proxy = runnerCommandResolveBrokerProxy();
      proxy.setupSourceRunner({ cwd: '/repo/packages/ward', binName: 'jest' });

      const result = runnerCommandResolveBroker({ binName: 'jest', cwd: '/repo/packages/ward' });

      expect(result).toStrictEqual({
        command: execPath,
        leadingArgs: ['--conditions=source', '/repo/packages/ward/node_modules/.bin/jest'],
      });
    });

    it('VALID: {binName: "playwright", shared source barrel reachable} => runs the bin through this node with --conditions=source', () => {
      const proxy = runnerCommandResolveBrokerProxy();
      proxy.setupSourceRunner({ cwd: '/repo/packages/web', binName: 'playwright' });

      const result = runnerCommandResolveBroker({
        binName: 'playwright',
        cwd: '/repo/packages/web',
      });

      expect(result).toStrictEqual({
        command: execPath,
        leadingArgs: ['--conditions=source', '/repo/packages/web/node_modules/.bin/playwright'],
      });
    });
  });

  describe('the source condition is not supported', () => {
    it('VALID: {binName: "jest", consumer install, shared packs dist only} => runs the bin itself with no leading args', () => {
      const proxy = runnerCommandResolveBrokerProxy();
      proxy.setupBuiltRunner({ cwd: '/consumer/packages/app', binName: 'jest' });

      const result = runnerCommandResolveBroker({ binName: 'jest', cwd: '/consumer/packages/app' });

      expect(result).toStrictEqual({
        command: '/consumer/packages/app/node_modules/.bin/jest',
        leadingArgs: [],
      });
    });
  });
});
