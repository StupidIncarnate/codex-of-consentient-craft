/**
 * PURPOSE: Handles POST requests recording a person's verdict on one `verifyByHuman` observable —
 * validates the merged path param (`questId`) + JSON body (`unitId`, `outcome`, `reason`) and
 * delegates to `questHumanVerdictRecordBroker` (`@dungeonmaster/orchestrator/brokers`) directly,
 * the same broker-subpath route `graph-reachability-check-responder.ts` takes: this write needs
 * none of `StartOrchestrator`'s live service surface (the rate-limits poller, the stale-process
 * watchdog, …), so no adapter sits between this responder and the broker.
 *
 * USAGE:
 * const result = await QuestHumanVerdictResponder({ params: { questId }, body: { unitId, outcome, reason } });
 * // Returns { status: 200, data: { ok: true } } or { status: 400, data: { error } }
 */

import { questHumanVerdictRecordBroker } from '@dungeonmaster/orchestrator/brokers';

import { humanVerdictInputContract } from '../../../contracts/human-verdict-input/human-verdict-input-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { errorFormatReasonTransformer } from '../../../transformers/error-format-reason/error-format-reason-transformer';

export const QuestHumanVerdictResponder = async ({
  params,
  body,
}: {
  params: unknown;
  body: unknown;
}): Promise<ResponderResult> => {
  const bodyCandidate = typeof body === 'object' && body !== null ? body : {};
  const paramsCandidate = typeof params === 'object' && params !== null ? params : {};
  // Path param questId is authoritative — it overrides any questId present in the body, mirroring
  // quest-signal-back-responder.ts's merge order.
  const candidate = { ...bodyCandidate, ...paramsCandidate };

  const parsed = humanVerdictInputContract.safeParse(candidate);
  if (!parsed.success) {
    return responderResultContract.parse({
      status: httpStatusStatics.clientError.badRequest,
      data: { error: 'Invalid human-verdict input' },
    });
  }

  const { questId, unitId, outcome, reason } = parsed.data;

  try {
    await questHumanVerdictRecordBroker({ questId, unitId, outcome, reason });
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: { ok: true },
    });
  } catch (error: unknown) {
    return responderResultContract.parse({
      status: httpStatusStatics.clientError.badRequest,
      data: { error: errorFormatReasonTransformer({ error }) },
    });
  }
};
