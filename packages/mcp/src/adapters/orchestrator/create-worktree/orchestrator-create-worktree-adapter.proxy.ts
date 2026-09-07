/**
 * PURPOSE: Proxy for orchestrator-create-worktree-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorCreateWorktreeAdapterProxy();
 * proxy.returns({ name: 'probe', result: { worktreePath: '/repo/worktrees/probe' } });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type CreateWorktreeResult = Awaited<ReturnType<typeof StartOrchestrator.createWorktree>>;

export const orchestratorCreateWorktreeAdapterProxy = (): {
  returns: (params: { name: string; result: CreateWorktreeResult }) => void;
  throws: (params: { name: string; error: Error }) => void;
  getLastCalledInputFor: (params: { name: string }) => unknown;
} => {
  const handle = registerMock({ fn: StartOrchestrator.createWorktree });

  return {
    // The name IS the address: one session can ask for several worktrees, and keying on anything
    // less would hand every one of them the same path.
    returns: ({ name, result }: { name: string; result: CreateWorktreeResult }): void => {
      handle.calledWith([{ name }]).resolves(result);
    },
    throws: ({ name, error }: { name: string; error: Error }): void => {
      handle.calledWith([{ name }]).rejects(error);
    },
    getLastCalledInputFor: ({ name }: { name: string }): unknown => {
      const calls = handle.callsMatching([{ name }]);
      return calls.at(-1)?.[0];
    },
  };
};
