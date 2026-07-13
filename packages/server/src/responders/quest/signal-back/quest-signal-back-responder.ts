/**
 * PURPOSE: Handles the env-gated HTTP signal-back endpoint by validating the merged path/body input
 * and delegating to the orchestrator adapter — the same StartOrchestrator.handleSignalBack surface
 * the MCP signal-back tool uses. Lets Playwright e2e drive the operations-ledger relay without an
 * MCP client.
 *
 * USAGE:
 * const result = await QuestSignalBackResponder({ params: { questId: 'abc' }, body: { workItemId, signal: 'complete', operationStatus: 'done' } });
 * // Returns { status: 200, data: { ok: true } } or { status: 400/500, data: { error } }
 */

import { orchestratorHandleSignalBackAdapter } from '../../../adapters/orchestrator/handle-signal-back/orchestrator-handle-signal-back-adapter';
import { signalBackInputContract } from '../../../contracts/signal-back-input/signal-back-input-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const QuestSignalBackResponder = async ({
  params,
  body,
}: {
  params: unknown;
  body: unknown;
}): Promise<ResponderResult> => {
  try {
    const bodyCandidate = typeof body === 'object' && body !== null ? body : {};
    const paramsCandidate = typeof params === 'object' && params !== null ? params : {};
    // Path param questId is authoritative — it overrides any questId present in the body.
    const candidate = { ...bodyCandidate, ...paramsCandidate };

    const parsed = signalBackInputContract.safeParse(candidate);
    if (!parsed.success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Invalid signal-back input' },
      });
    }

    const { questId, workItemId, signal, operationItemId, operationStatus } = parsed.data;

    await orchestratorHandleSignalBackAdapter({
      questId,
      workItemId,
      signal,
      ...(operationItemId === undefined ? {} : { operationItemId }),
      ...(operationStatus === undefined ? {} : { operationStatus }),
    });

    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: { ok: true },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to signal back';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
