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
 * THREE EXTRAS SURVIVE, and each is a value no tool call returns at all: the dev server for
 * siegemaster (resolved by the broker from `.dungeonmaster.json`), the base branch for warpgate,
 * and the failed ward result + blob path for spiritmender.
 *
 * **Path discrimination — minion vs role:** the agent name is run through
 * `workItemRoleContract.safeParse`. If it fails, the caller is one of the parent-summoned minions
 * and receives a minimal "Quest ID + Work Item ID" substitution; the parent briefs the context
 * inline. None of them THROWS here — each minion prompt is one literal file rather than a template
 * awaiting a discipline, so there is no unresolvable placeholder left for this transformer to
 * refuse. EVERY role takes the relay path below.
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
 * const { prompt } = workItemToPromptTransformer({ quest, workItem, agentName });
 * // Returns ContentText prompt with $ARGUMENTS replaced by operation-relay context
 */

import {
  contentTextContract,
  workItemRoleContract,
  type ContentText,
  type Quest,
  type WorkItem,
} from '@dungeonmaster/shared/contracts';
import { isChatWorkItemRoleGuard, isCommandWorkItemRoleGuard } from '@dungeonmaster/shared/guards';

import { agentPromptNameContract } from '../../contracts/agent-prompt-name/agent-prompt-name-contract';
import { agentRoleContract } from '../../contracts/agent-role/agent-role-contract';
import type { DevCommand } from '../../contracts/dev-command/dev-command-contract';
import type { DevServerUrl } from '../../contracts/dev-server-url/dev-server-url-contract';
import { agentNameToPromptTransformer } from '../agent-name-to-prompt/agent-name-to-prompt-transformer';
import { roleToPromptTemplateTransformer } from '../role-to-prompt-template/role-to-prompt-template-transformer';

export const workItemToPromptTransformer = ({
  quest,
  workItem,
  agentName,
  devServer,
}: {
  quest: Quest;
  workItem: WorkItem;
  agentName: string;
  // Dev-server config for flowrider/siegemaster, resolved by the broker from .dungeonmaster.json.
  devServer?: {
    devCommand: DevCommand;
    devServerUrl: DevServerUrl;
  };
}): { prompt: ContentText } => {
  const parsedAgent = agentPromptNameContract.parse(agentName);
  const minionArguments = `Quest ID: ${String(quest.id)}\nWork Item ID: ${String(workItem.id)}`;

  // Minion path: agent name does not correspond to a WorkItemRole — it's parent-dispatched
  // via the Agent tool, with the parent's workItemId echoed in the get-agent-prompt call.
  const isWorkItemRole = workItemRoleContract.safeParse(parsedAgent).success;
  if (!isWorkItemRole) {
    const { prompt: template } = agentNameToPromptTransformer({ agent: parsedAgent });
    return {
      prompt: contentTextContract.parse(template.replace('$ARGUMENTS', () => minionArguments)),
    };
  }

  // Every COMMAND role, not `ward` alone. A command work item is run by the dispatcher itself and
  // has no prompt to fetch; matching the whole subset is what makes the refusal say so, instead of
  // letting the role fall through to `agentNameToPromptTransformer` and die on an agent name that
  // was never meant to exist.
  if (isCommandWorkItemRoleGuard({ role: workItem.role })) {
    throw new Error(
      `workItemToPromptTransformer: ${workItem.role} work items are dispatched as commands by the orchestrator, not via get-agent-prompt`,
    );
  }

  if (isChatWorkItemRoleGuard({ role: workItem.role })) {
    // Chat roles are briefed by their own entry point, not by the dispatch loop: chaoswhisperer
    // and bughunt run as the /dumpster-create and /dumpster-hunt slash command bodies (or as a
    // headless node-mode spawn built by chatPromptBuildTransformer); glyphsmith runs through the
    // chat-broker design flow. None has a dispatch-loop lifecycle.
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

  // Siegemaster only. Flowrider starts no server of its own — its Playwright runs bring one up from
  // the project's own `webServer` config and tear it down again — so these lines would be dead
  // context for it.
  if (workItem.role === 'siegemaster' && devServer !== undefined) {
    parts.push(
      contentTextContract.parse(''),
      contentTextContract.parse(`Dev Server Command: ${String(devServer.devCommand)}`),
      contentTextContract.parse(`Dev Server URL: ${String(devServer.devServerUrl)}`),
    );
  }

  // Warpgate only. The prompt template tells the agent to resolve the base branch "recorded ON
  // THE QUEST in your Operation Context below" and never re-probe it — this is the half of that
  // promise that has to actually render the value, or the agent has nothing to read there and
  // must fall back to a get-quest call the prompt never tells it to make. Guarded on baseBranch
  // being set at all: a quest reaches `merging` only after Start Quest recorded its git context,
  // but the field stays optional on the contract, so an unset value is omitted rather than
  // rendered as the literal string "undefined".
  if (workItem.role === 'warpgate' && quest.baseBranch !== undefined) {
    parts.push(
      contentTextContract.parse(''),
      contentTextContract.parse(`Base branch: ${String(quest.baseBranch)}`),
    );
  }

  if (workItem.role === 'spiritmender') {
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

  // Re-brand through agentRoleContract rather than relying on narrowing: the ward and chat-role
  // rejections above are guard calls, which return a plain boolean and so do not narrow the union.
  // Parsing states the same invariant the throws already enforce, and fails loudly if it is broken.
  const template = roleToPromptTemplateTransformer({
    role: agentRoleContract.parse(workItem.role),
  });

  // Function replacement, not a string one: operation text is authored prose that can contain a
  // `$` sequence (`$&`, `` $` ``, `$'`), which a string replacement would expand against the match
  // — `` $` `` splices the whole preceding prompt in. A function replacement is taken verbatim.
  return {
    prompt: contentTextContract.parse(template.replace('$ARGUMENTS', () => parts.join('\n'))),
  };
};
