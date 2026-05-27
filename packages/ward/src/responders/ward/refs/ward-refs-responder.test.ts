import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { WardRefsResponderProxy } from './ward-refs-responder.proxy';

describe('WardRefsResponder', () => {
  describe('no workspaces', () => {
    it('VALID: {single-package mode, mode sync} => writes informational message to stderr', async () => {
      const proxy = WardRefsResponderProxy();
      proxy.setupNoWorkspaces();

      await proxy.callResponder({
        args: ['node', 'ward', 'refs:sync'],
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
        mode: 'sync',
      });

      expect(proxy.getStderrCalls()).toStrictEqual([
        'refs: no workspaces found in root package.json — nothing to do.\n',
      ]);
    });
  });

  describe('sync mode, in-sync result', () => {
    it('VALID: {workspaces present, refs already in sync} => writes confirmation to stdout', async () => {
      const proxy = WardRefsResponderProxy();
      proxy.setupSingleEligibleInSync();

      await proxy.callResponder({
        args: ['node', 'ward', 'refs:sync'],
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
        mode: 'sync',
      });

      expect(proxy.getStdoutCalls()).toStrictEqual([
        'refs: project references in sync (1 eligible packages)\n',
      ]);
    });
  });

  describe('check mode, in-sync result', () => {
    it('VALID: {workspaces present, refs already in sync, mode check} => writes confirmation to stdout', async () => {
      const proxy = WardRefsResponderProxy();
      proxy.setupSingleEligibleInSync();

      await proxy.callResponder({
        args: ['node', 'ward', 'refs:check'],
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
        mode: 'check',
      });

      expect(proxy.getStdoutCalls()).toStrictEqual([
        'refs: project references in sync (1 eligible packages)\n',
      ]);
    });
  });
});
