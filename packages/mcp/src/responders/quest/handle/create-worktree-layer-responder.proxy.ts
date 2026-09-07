/**
 * PURPOSE: Proxy for create-worktree-layer-responder. Delegates to the orchestrator adapter proxy.
 *
 * USAGE:
 * const proxy = CreateWorktreeLayerResponderProxy();
 * proxy.setupReturns({ name: 'probe', result: { worktreePath: '/repo/worktrees/probe' } });
 */

import type { StartOrchestrator } from '@dungeonmaster/orchestrator';

import { orchestratorCreateWorktreeAdapterProxy } from '../../../adapters/orchestrator/create-worktree/orchestrator-create-worktree-adapter.proxy';

type CreateWorktreeResult = Awaited<ReturnType<typeof StartOrchestrator.createWorktree>>;

export const CreateWorktreeLayerResponderProxy = (): {
  setupReturns: (params: { name: string; result: CreateWorktreeResult }) => void;
  setupThrows: (params: { name: string; error: Error }) => void;
  getLastCalledInputFor: (params: { name: string }) => unknown;
} => {
  const adapterProxy = orchestratorCreateWorktreeAdapterProxy();

  return {
    setupReturns: ({ name, result }: { name: string; result: CreateWorktreeResult }): void => {
      adapterProxy.returns({ name, result });
    },
    setupThrows: ({ name, error }: { name: string; error: Error }): void => {
      adapterProxy.throws({ name, error });
    },
    getLastCalledInputFor: ({ name }: { name: string }): unknown =>
      adapterProxy.getLastCalledInputFor({ name }),
  };
};
