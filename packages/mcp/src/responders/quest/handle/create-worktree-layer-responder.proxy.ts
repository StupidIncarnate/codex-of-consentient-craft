/**
 * PURPOSE: Proxy for create-worktree-layer-responder. Composes orchestrator's own cross-package
 * proxy, and re-derives `getLastCalledInputFor` from `createWorktreeGetCalls()` — a responder's own
 * test may not import another package, so the only route to staging a real call runs through this
 * shared proxy.
 *
 * USAGE:
 * const proxy = CreateWorktreeLayerResponderProxy();
 * proxy.setupReturns({ name: 'probe', result: { worktreePath: '/repo/worktrees/probe' } });
 */

import type { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';

type CreateWorktreeResult = Awaited<ReturnType<typeof StartOrchestrator.createWorktree>>;
// Derived from the real StartOrchestrator.createWorktree signature (never hand-typed) so the
// elements createWorktreeGetCalls() hands back can be read by field without an ad-hoc cast.
type CreateWorktreeParams = Parameters<typeof StartOrchestrator.createWorktree>[0];

export const CreateWorktreeLayerResponderProxy = (): {
  setupReturns: (params: { name: string; result: CreateWorktreeResult }) => void;
  setupThrows: (params: { name: string; error: Error }) => void;
  getLastCalledInputFor: (params: { name: string }) => unknown;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupReturns: ({ name, result }: { name: string; result: CreateWorktreeResult }): void => {
      orchestrator.createWorktreeReturns({ name, result });
    },
    setupThrows: ({ name, error }: { name: string; error: Error }): void => {
      orchestrator.createWorktreeThrows({ name, error });
    },
    getLastCalledInputFor: ({ name }: { name: string }): unknown => {
      const calls = orchestrator.createWorktreeGetCalls() as CreateWorktreeParams[];
      return calls.filter((call) => call.name === name).at(-1);
    },
  };
};
