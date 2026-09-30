/**
 * PURPOSE: Handles the env-gated HTTP signal-back endpoint by validating the merged path/body input
 * and delegating to `StartOrchestrator.handleSignalBack` — the same surface the MCP signal-back tool
 * uses. Lets Playwright e2e drive the operations-ledger relay without an MCP client.
 *
 * USAGE:
 * const result = await QuestSignalBackResponder({ params: { questId: 'abc' }, body: { workItemId, signal: 'complete' } });
 * // Returns { status: 200, data: { ok: true } } or { status: 400/500, data: { error } }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { signalBackInputContract } from '@dungeonmaster/shared/contracts';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { responderErrorDataContract } from '../../../contracts/responder-error-data/responder-error-data-contract';
import { questSignalBackResponseDataContract } from '../../../contracts/quest-signal-back-response-data/quest-signal-back-response-data-contract';

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
        data: responderErrorDataContract.parse({ error: 'Invalid signal-back input' }),
      });
    }

    const { questId, workItemId, signal, operationItemId, blockedReason } = parsed.data;

    await StartOrchestrator.handleSignalBack({
      questId,
      workItemId,
      signal,
      ...(operationItemId === undefined ? {} : { operationItemId }),
      ...(blockedReason === undefined ? {} : { blockedReason }),
    });

    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: questSignalBackResponseDataContract.parse({ ok: true }),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to signal back';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: responderErrorDataContract.parse({ error: message }),
    });
  }
};
