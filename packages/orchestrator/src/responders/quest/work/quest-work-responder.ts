/**
 * PURPOSE: Validates and applies ONE `quest-work` call — the single MCP write surface every LLM
 * step calls, across its six payload kinds. `plan` and `amendment` write a plan file through
 * `questWorkPlanWriteBroker`; `observations`, `outcome`, `invalidation` and `request` mutate
 * `quest.json` through `questWorkRecordBroker`.
 *
 * USAGE:
 * const result = await QuestWorkResponder({ questId: 'add-auth', workItemId: 'f47ac10b-…', payload: { kind: 'outcome', word: 'done', reason: '…' } });
 * // Returns { kind: 'outcome', word: 'done' }
 *
 * EVERY REFUSAL THROWS — this responder never returns `{ success: false }`. The error rides the
 * awaited MCP path back to the agent, where it is visible and actionable, exactly as `signal-back`'s
 * own responder does (`quest-handle-signal-back-responder.ts`) — a returned failure would be
 * swallowed as a success by the MCP layer. Nothing is persisted on a refusal, so the session fixes
 * what the message names and calls again.
 */

import { questWorkInputContract } from '../../../contracts/quest-work-input/quest-work-input-contract';
import { questWorkResultContract } from '../../../contracts/quest-work-result/quest-work-result-contract';
import type { QuestWorkResult } from '../../../contracts/quest-work-result/quest-work-result-contract';
import { questWorkPlanWriteBroker } from '../../../brokers/quest/work-plan-write/quest-work-plan-write-broker';
import { questWorkRecordBroker } from '../../../brokers/quest/work-record/quest-work-record-broker';

export const QuestWorkResponder = async ({
  questId,
  workItemId,
  payload,
}: {
  questId: string;
  workItemId: string;
  payload: unknown;
}): Promise<QuestWorkResult> => {
  const parsed = questWorkInputContract.parse({ questId, workItemId, payload });

  if (parsed.payload.kind === 'plan' || parsed.payload.kind === 'amendment') {
    const { operationItemId } = await questWorkPlanWriteBroker({
      questId: parsed.questId,
      workItemId: parsed.workItemId,
      plan: parsed.payload.plan,
    });

    return questWorkResultContract.parse({ kind: parsed.payload.kind, operationItemId });
  }

  const result = await questWorkRecordBroker({
    questId: parsed.questId,
    workItemId: parsed.workItemId,
    payload: parsed.payload,
  });

  return questWorkResultContract.parse(result);
};
