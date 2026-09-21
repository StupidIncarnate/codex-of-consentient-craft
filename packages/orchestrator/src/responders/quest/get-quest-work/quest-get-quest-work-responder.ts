/**
 * PURPOSE: Serves the ONE startup call every LLM step makes, across its two call shapes — a work
 * item gets everything that session needs to start, an operation item gets the whole plan as
 * markdown for a planner's review-before-signing read. Reach for this over
 * `QuestGetQaChecklistResponder`: that one enumerates a flow for a renderer, and this one answers
 * "what am I, what was I assigned, and what did the sessions before me leave".
 *
 * USAGE:
 * await QuestGetQuestWorkResponder({ questId, workItemId });
 * // Returns { kind: 'view', view }
 *
 * await QuestGetQuestWorkResponder({ questId, operationItemId });
 * // Returns { kind: 'plan', text } — already-rendered markdown, never JSON-wrapped
 *
 * BOTH IDS IN ONE CALL IS A HARD REJECTION, not a precedence rule. The two shapes answer different
 * questions — "what does this session run" and "is the plan for this whole scope sound" — and
 * letting one win silently answers a question the caller did not ask. NEITHER id is refused too:
 * there is no whole-quest browse form here.
 *
 * EVERY REFUSAL THROWS. The error rides the awaited MCP path back to the agent, where it is visible
 * and actionable, exactly as `QuestWorkResponder`'s own refusals do — a returned failure shape would
 * be read as a success by the layer above.
 */

import { operationItemIdContract, questIdContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';
import { questWorkItemIdContract } from '@dungeonmaster/shared/contracts';

import type { QuestWorkView } from '../../../contracts/quest-work-view/quest-work-view-contract';
import { questGetQuestWorkBroker } from '../../../brokers/quest/get-quest-work/quest-get-quest-work-broker';
import { questGetWorkPlanBroker } from '../../../brokers/quest/get-work-plan/quest-get-work-plan-broker';

// BOTH KEYS ARE ALWAYS PRESENT and exactly one of them is non-null, so the layer above reads
// `planText !== null` to decide between raw markdown and JSON rather than matching a tag. The type
// is written as a union of the two populated shapes purely so `lint --fix` cannot rewrite it into
// an `interface`, which `ban-adhoc-types` then refuses in a responder.
export type QuestGetQuestWorkResult =
  | { readonly view: QuestWorkView; readonly planText: null }
  | { readonly view: null; readonly planText: ContentText };

export const QuestGetQuestWorkResponder = async ({
  questId,
  workItemId,
  operationItemId,
}: {
  questId: string;
  workItemId?: string;
  operationItemId?: string;
}): Promise<QuestGetQuestWorkResult> => {
  if (workItemId !== undefined && operationItemId !== undefined) {
    throw new Error(
      'get-quest-work: workItemId cannot be combined with operationItemId — a work item asks what THIS session runs and an operation item asks whether the plan for the whole scope is sound. Pass exactly one.',
    );
  }

  if (workItemId === undefined && operationItemId === undefined) {
    throw new Error(
      'get-quest-work: pass either workItemId (everything this session needs to start) or operationItemId (the whole plan as markdown). There is no whole-quest browse form.',
    );
  }

  const parsedQuestId = questIdContract.parse(questId);

  if (operationItemId !== undefined) {
    return {
      view: null,
      planText: await questGetWorkPlanBroker({
        questId: parsedQuestId,
        operationItemId: operationItemIdContract.parse(operationItemId),
      }),
    };
  }

  return {
    view: await questGetQuestWorkBroker({
      questId: parsedQuestId,
      workItemId: questWorkItemIdContract.parse(workItemId),
    }),
    planText: null,
  };
};
