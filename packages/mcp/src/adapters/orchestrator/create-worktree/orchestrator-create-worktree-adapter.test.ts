import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { orchestratorCreateWorktreeAdapter } from './orchestrator-create-worktree-adapter';
import { orchestratorCreateWorktreeAdapterProxy } from './orchestrator-create-worktree-adapter.proxy';

describe('orchestratorCreateWorktreeAdapter', () => {
  describe('one worktree', () => {
    it('VALID: {name} => returns the worktree path the orchestrator carved', async () => {
      const proxy = orchestratorCreateWorktreeAdapterProxy();
      proxy.returns({
        name: 'probe',
        result: {
          worktreePath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe' }),
        },
      });

      const result = await orchestratorCreateWorktreeAdapter({ name: 'probe' });

      expect(result).toStrictEqual({ worktreePath: '/repo/worktrees/probe' });
    });

    it('VALID: {name} => forwards the name to the orchestrator', async () => {
      const proxy = orchestratorCreateWorktreeAdapterProxy();
      proxy.returns({
        name: 'probe',
        result: { worktreePath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe' }) },
      });

      await orchestratorCreateWorktreeAdapter({ name: 'probe' });

      expect(proxy.getLastCalledInputFor({ name: 'probe' })).toStrictEqual({ name: 'probe' });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => rejects with error', async () => {
      const proxy = orchestratorCreateWorktreeAdapterProxy();
      proxy.throws({ name: 'probe', error: new Error('Base branch not found') });

      await expect(orchestratorCreateWorktreeAdapter({ name: 'probe' })).rejects.toThrow(
        /Base branch not found/u,
      );
    });
  });
});
