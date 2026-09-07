import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { CreateWorktreeLayerResponder } from './create-worktree-layer-responder';
import { CreateWorktreeLayerResponderProxy } from './create-worktree-layer-responder.proxy';

const JSON_INDENT_SPACES = 2;

describe('CreateWorktreeLayerResponder', () => {
  describe('successful carve', () => {
    it('VALID: {name} => returns the path under the `path` key', async () => {
      const proxy = CreateWorktreeLayerResponderProxy();
      proxy.setupReturns({
        name: 'probe',
        result: { worktreePath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe' }) },
      });

      const result = await CreateWorktreeLayerResponder({ args: { name: 'probe' } });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ path: '/repo/worktrees/probe' }, null, JSON_INDENT_SPACES),
          },
        ],
      });
    });

    it('VALID: {name} => forwards the name to the orchestrator', async () => {
      const proxy = CreateWorktreeLayerResponderProxy();
      proxy.setupReturns({
        name: 'quest-add-auth',
        result: {
          worktreePath: AbsoluteFilePathStub({ value: '/repo/worktrees/quest-add-auth' }),
        },
      });

      await CreateWorktreeLayerResponder({ args: { name: 'quest-add-auth' } });

      expect(proxy.getLastCalledInputFor({ name: 'quest-add-auth' })).toStrictEqual({
        name: 'quest-add-auth',
      });
    });
  });

  describe('adapter failures', () => {
    it('ERROR: {orchestrator throws} => returns the JSON error shape with isError', async () => {
      const proxy = CreateWorktreeLayerResponderProxy();
      proxy.setupThrows({ name: 'probe', error: new Error('Base branch not found') });

      const result = await CreateWorktreeLayerResponder({ args: { name: 'probe' } });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'Base branch not found' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });

  describe('input validation', () => {
    it('INVALID: {missing name} => throws before any adapter call', async () => {
      CreateWorktreeLayerResponderProxy();

      await expect(CreateWorktreeLayerResponder({ args: {} })).rejects.toThrow(/Required/u);
    });

    it('INVALID: {unknown key} => throws on the strict contract, a caller never chooses the location', async () => {
      CreateWorktreeLayerResponderProxy();

      await expect(
        CreateWorktreeLayerResponder({ args: { name: 'probe', path: '/tmp/elsewhere' } }),
      ).rejects.toThrow(/Unrecognized key/u);
    });
  });
});
