/**
 * PURPOSE: Builds the fully-substituted agent prompt the MCP `get-agent-prompt` tool serves
 * for a dispatched agent session. Resolves the work item's `operations/<id>` ref into its
 * operation item and substitutes `$ARGUMENTS` in the role's prompt template with FOUR IDS — the
 * quest, the work item, the operation item, and that operation item's own text — plus the
 * role-specific extras below.
 *
 * THE BLOCK CARRIES IDS, NOT QUEST CONTENT. Every session fetches its own scope: `get-quest` for
 * the flow and the contracts, `get-qa-checklist` for the units. Each role's prompt spells the calls
 * out, and the flow id and package name they take are in the operation item's own TEXT
 * (`… — package: <name> · flow: <id>`), which is why that line is one of the four.
 *
 * Two tool results are two separate `mcpToolResultStatics.maxVerbatimChars` (50,000) budgets.
 * Rendering the scope inline measured 61,501 characters for one real item and spilled the whole
 * prompt to a file, which hands the session a path instead of its instructions and reports no
 * failure.
 *
 * THREE EXTRAS SURVIVE, and each is a value no tool call returns at all: the base branch for
 * warpgate, the failed ward result + blob path for spiritmender, and the instance id for a
 * `needsLane` step — the ROUTER started that instance and recorded it onto
 * `workItem.payload.instance` before this item ever dispatched, so the id it substitutes is
 * exactly what the router owns, never a session's own guess at a lane it never opened.
 *
 * **The STEP names the prompt this serves, and `agentName` is the fallback.** A work item carries
 * the role of its SCOPE, so a `repair` step inside a `ward` scope reads `role: 'ward'` while its step
 * declares `prompt: 'spiritmender'`. Resolving the step node decides three things here: whether the
 * command-role refusal below applies at all (a ward item at a PROMPT step does have a prompt to
 * fetch), which role's conditional extras render — the failed ward result the repair session is being
 * sent to fix — and which template is served.
 *
 * **Path discrimination — minion vs role:** only when a work item has no step prompt and its agent
 * name is run through `workItemRoleContract.safeParse` and fails is it treated as a parent-summoned
 * minion receiving a minimal "Quest ID + Work Item ID" substitution; the parent briefs the context
 * inline. Stepped work items are relay work items that need the operation context substituted in
 * `$ARGUMENTS`, never minions.
 *
 * **THE REPORTED MODEL AGREES WITH THE SPAWNED ONE, BECAUSE BOTH READ THE SAME STEP NODE.** A
 * minion reports whatever `agentNameToPromptTransformer`'s per-PROMPT-NAME table states for it —
 * the only value available, since a minion has no work item and no step. Every other path (a role
 * at a step, or a role-keyed work item with none) reports the work item's own step model — the
 * SAME `agentFlowStatics` node `buildSpawnInstructionLayerBroker` reads for the real dispatch, with
 * the same scope-role fallback (`roleToModelTransformer({ role: workItem.role })`) for a work item
 * that runs no step graph. Reporting `agentNameToPromptTransformer`'s per-name model here instead
 * — `codeweaver-worker` reads `roleToModelStatics.codeweaver` (`opus`) there, while the step itself
 * declares `sonnet` — is exactly how a session could be told it is running on a model different
 * from the one dispatch actually gave it.
 *
 * Every parent prompt instructs its minion to fetch with `{ agent, questId }` and NO `workItemId`,
 * which routes to `agentPromptGetBroker`'s minion-fetch branch (a bare `Quest ID:` substitution, no
 * quest load) and never reaches this transformer. That is deliberate and load-bearing:
 * `subagentStopNeedsBlockGuard` treats a `get-agent-prompt` call carrying a workItemId as proof the
 * caller is a work-item agent and blocks it from stopping until it calls `signal-back`. A minion that
 * passed its parent's workItemId would be held to that rule and could only escape by signalling on
 * the PARENT's operation item — completing the parent's scope while the parent is still running. The
 * branch below stays for a caller that echoes an id anyway; it must not become the documented path.
 *
 * USAGE:
 * const { prompt, model } = workItemToPromptTransformer({ quest, workItem, agentName });
 * // Returns ContentText prompt with $ARGUMENTS replaced by operation-relay context, and the
 * // ClaudeModel this same work item is dispatched on
 */

import {
  agentPromptResultContract,
  contentTextContract,
  workItemRoleContract,
  type AgentPromptResult,
  type ContentText,
  type Quest,
  type WorkItem,
} from '@dungeonmaster/shared/contracts';
import { isChatWorkItemRoleGuard, isCommandWorkItemRoleGuard } from '@dungeonmaster/shared/guards';

import { agentPromptNameContract } from '../../contracts/agent-prompt-name/agent-prompt-name-contract';
import { questWorkInstanceContract } from '../../contracts/quest-work-instance/quest-work-instance-contract';
import { agentNameToPromptTransformer } from '../agent-name-to-prompt/agent-name-to-prompt-transformer';
import { roleToModelTransformer } from '../role-to-model/role-to-model-transformer';
import { workItemStepNodeTransformer } from '../work-item-step-node/work-item-step-node-transformer';

export const workItemToPromptTransformer = ({
  quest,
  workItem,
  agentName,
}: {
  quest: Quest;
  workItem: WorkItem;
  agentName: string;
}): { prompt: ContentText; model: AgentPromptResult['model'] } => {
  const node = workItemStepNodeTransformer({ quest, workItem });
  const hasStepPrompt = node?.kind === 'prompt' && node.prompt !== undefined;
  const promptName =
    node?.kind === 'prompt' && node.prompt !== undefined
      ? node.prompt
      : (agentPromptNameContract.safeParse(agentName).data ??
        agentPromptNameContract.parse(workItem.role));

  // Minion path: agent name does not correspond to a WorkItemRole — it's parent-dispatched
  // via the Agent tool, with the parent's workItemId echoed in the get-agent-prompt call.
  // Stepped work items are relay work items that need the operation context substituted in
  // $ARGUMENTS, never minions.
  const isWorkItemRole = workItemRoleContract.safeParse(promptName).success;
  if (!hasStepPrompt && !isWorkItemRole) {
    const minionArguments = `Quest ID: ${String(quest.id)}\nWork Item ID: ${String(workItem.id)}`;
    const { prompt: template, model } = agentNameToPromptTransformer({ agent: promptName });
    return {
      prompt: contentTextContract.parse(template.replace('$ARGUMENTS', () => minionArguments)),
      model,
    };
  }

  // Every COMMAND role, not `ward` alone. A command work item is run by the dispatcher itself and
  // has no prompt to fetch; matching the whole subset is what makes the refusal say so, instead of
  // letting the role fall through to `agentNameToPromptTransformer` and die on an agent name that
  // was never meant to exist. A command scope at a PROMPT step (e.g. ward's repair step running
  // spiritmender) DOES have a prompt to fetch and bypasses this refusal.
  if (!hasStepPrompt && isCommandWorkItemRoleGuard({ role: workItem.role })) {
    throw new Error(
      `workItemToPromptTransformer: ${workItem.role} work items are dispatched as commands by the orchestrator, not via get-agent-prompt`,
    );
  }

  if (isChatWorkItemRoleGuard({ role: workItem.role })) {
    // Chat roles are briefed by their own entry point, not by the dispatch loop: chaoswhisperer
    // and bughunt run as the /dumpster-create and /dumpster-hunt slash command bodies (or as a
    // headless node-mode spawn built by chatPromptBuildTransformer). None has a dispatch-loop
    // lifecycle.
    throw new Error(
      `workItemToPromptTransformer: role ${workItem.role} is not served by get-agent-prompt`,
    );
  }

  // Relay path: resolve the work item's linked operation item, whose id and text are two of the
  // four lines the block carries.
  const linkedRef = workItem.relatedDataItems
    .map((ref) => String(ref))
    .find((ref) => ref.startsWith('operations/'));
  const linkedOperation = quest.operations.find(
    (operation) => String(operation.id) === (linkedRef?.split('/')[1] ?? ''),
  );
  if (linkedOperation === undefined) {
    throw new Error(
      `workItemToPromptTransformer: ${workItem.role} work item ${String(workItem.id)} has no resolvable operations/<id> reference`,
    );
  }

  // FOUR LINES, and the fourth is load-bearing rather than a caption. The operation item's TEXT is
  // where the flow id and the package name live (`… — package: <name> · flow: <id>`, minted by
  // `relayTailFanOutTransformer`), so it is the only thing in this block a session reads an ARGUMENT
  // out of. Every prompt that spells out a `get-quest` or `get-qa-checklist` call takes its
  // substitutions from these four.
  const parts: ContentText[] = [
    contentTextContract.parse(`Quest ID: ${String(quest.id)}`),
    contentTextContract.parse(`Work Item ID: ${String(workItem.id)}`),
    contentTextContract.parse(`Operation Item ID: ${String(linkedOperation.id)}`),
    contentTextContract.parse(
      `Your operation item: [${linkedOperation.role}] ${String(linkedOperation.text)}`,
    ),
  ];

  // Warpgate only. The prompt template tells the agent to resolve the base branch "recorded ON
  // THE QUEST in your Operation Context below" and never re-probe it — this is the half of that
  // promise that has to actually render the value, or the agent has nothing to read there and
  // must fall back to a get-quest call the prompt never tells it to make. Guarded on baseBranch
  // being set at all: a quest reaches `merging` only after Start Quest recorded its git context,
  // but the field stays optional on the contract, so an unset value is omitted rather than
  // rendered as the literal string "undefined".
  const isWarpgate =
    (node?.kind === 'prompt' && node.prompt === 'warpgate') || workItem.role === 'warpgate';
  if (isWarpgate && quest.baseBranch !== undefined) {
    parts.push(
      contentTextContract.parse(''),
      contentTextContract.parse(`Base branch: ${String(quest.baseBranch)}`),
    );
  }

  // Keyed on the step prompt or role, which is how a `repair` step inside a ward scope gets the blob
  // it was minted to fix: its work item reads `role: 'ward'`, and a spiritmender served without these
  // two lines has nothing naming the failure.
  const isSpiritmender =
    (node?.kind === 'prompt' && node.prompt === 'spiritmender') || workItem.role === 'spiritmender';
  if (isSpiritmender) {
    const latestFailedWard = [...quest.wardResults]
      .filter((wardResult) => wardResult.exitCode !== 0)
      .at(-1);
    if (latestFailedWard !== undefined) {
      parts.push(
        contentTextContract.parse(''),
        contentTextContract.parse(
          `Failed ward result: ${String(latestFailedWard.id)} (mode: ${String(latestFailedWard.wardMode)}${latestFailedWard.runId === undefined ? '' : `, runId: ${String(latestFailedWard.runId)}`})`,
        ),
        contentTextContract.parse(
          `Ward detail blob: <questFolder>/ward-results/${String(latestFailedWard.id)}.json`,
        ),
      );
    }
  }

  // The instance id, on a `needsLane` step only — the third conditional extra, on the same pattern
  // as warpgate's `Base branch` above. The ROUTER started this instance and recorded it onto
  // `workItem.payload.instance` (`questWorkInstanceContract`'s shape) BEFORE this item ever
  // dispatched, so a live record is the ordinary case; a `needsLane` item with none yet renders no
  // line here rather than a placeholder. ONLY THE ID RENDERS — never `baseUrl`, which a walker
  // fetches for itself through `get-quest-work`'s `instance` row. Rendering the manifest itself
  // here risks the degenerate case this file's own rule guards against everywhere else: a nullable
  // field stringified unconditionally reads back as the literal text "null", exactly what
  // `Base branch`'s own guard above exists to avoid.
  if (workItem.needsLane === true) {
    const parsedInstance = questWorkInstanceContract.safeParse(workItem.payload?.instance);
    if (parsedInstance.success) {
      parts.push(
        contentTextContract.parse(''),
        contentTextContract.parse(`Instance ID: ${String(parsedInstance.data.instanceId)}`),
      );
    }
  }

  const { prompt: template } = agentNameToPromptTransformer({
    agent: promptName,
  });

  // THE MODEL COMES OFF THE STEP NODE, NEVER OFF `agentNameToPromptTransformer`'s per-PROMPT-NAME
  // table — that table is what let `get-agent-prompt` report a model different from the one dispatch
  // actually spawned (see this file's own header). The same condition that decided `hasStepPrompt`
  // above guards which side supplies it: a stepped work item reads its step's own declared model,
  // and a role-keyed one with no step graph (a legacy/hydrated quest, or a directly-minted
  // spiritmender/warpgate item) falls back to the scope role's model — the identical fallback
  // `buildSpawnInstructionLayerBroker` applies for the real dispatch. `workItem.role` is guaranteed
  // non-command and non-chat here: both throw above. Re-parsed into `AgentPromptResult`'s own
  // `model` brand at the boundary — `ClaudeModel` and `AgentPromptResultModel` carry the same
  // values but are deliberately distinct brands, one scoped to the CLI flag this package resolves,
  // the other to the shared wire contract `get-agent-prompt` serves.
  const resolvedModel = agentPromptResultContract.shape.model.parse(
    (node?.kind === 'prompt' && node.prompt !== undefined ? node.model : undefined) ??
      roleToModelTransformer({ role: workItem.role }),
  );

  // Function replacement, not a string one: operation text is authored prose that can contain a
  // `$` sequence (`$&`, `` $` ``, `$'`), which a string replacement would expand against the match
  // — `` $` `` splices the whole preceding prompt in. A function replacement is taken verbatim.
  return {
    prompt: contentTextContract.parse(template.replace('$ARGUMENTS', () => parts.join('\n'))),
    model: resolvedModel,
  };
};
