/**
 * PURPOSE: Builds the fully-substituted agent prompt the MCP `get-agent-prompt` tool serves
 * for a dispatched agent session. Resolves the work item's `operations/<id>` ref into its
 * operation item and substitutes `$ARGUMENTS` in the role's prompt template with the operation
 * context: the item being worked, the operations ledger (the agent verifies it is the right
 * next step against git before trusting it), and role-specific extras (dev server for siegemaster,
 * the failed ward result for spiritmender, the base branch for warpgate).
 *
 * The ledger render is bounded by `operationsLedgerRenderStatics` so the served MCP block stays
 * under `mcpToolResultStatics.maxVerbatimChars`. Oldest COMPLETED items are elided first and
 * replaced by one notice line naming the exact count and pointing at `get-quest`; the agent's own
 * item and every `in_progress` / `pending` item are always rendered.
 *
 * **Path discrimination — minion vs role:** the agent name is run through
 * `workItemRoleContract.safeParse`. If it fails, the caller is one of the four parent-summoned
 * minions and receives a minimal "Quest ID + Work Item ID" substitution; the parent briefs task
 * context inline. In practice only `chaoswhisperer-gap-minion` can be served that way here: the
 * three generic minions (`planner-minion` / `worker-minion` / `reviewer-minion`) carry a
 * `$DISCIPLINE` placeholder and this transformer has no discipline to resolve it with, so one
 * arriving here throws rather than serving an unparameterized prompt. EVERY role takes the relay
 * path below, `pesteater` included — as an operation orchestrator it needs its operation item, the
 * ledger, `packagesAffected` and the user request exactly as its four siblings do.
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
import { operationsLedgerRenderStatics } from '../../statics/operations-ledger-render/operations-ledger-render-statics';
import { roleToDisciplineStatics } from '../../statics/role-to-discipline/role-to-discipline-statics';
import type { DevCommand } from '../../contracts/dev-command/dev-command-contract';
import type { DevServerUrl } from '../../contracts/dev-server-url/dev-server-url-contract';
import { signoffTrackEligibilityStatics } from '../../statics/signoff-track-eligibility/signoff-track-eligibility-statics';
import { agentNameToPromptTransformer } from '../agent-name-to-prompt/agent-name-to-prompt-transformer';
import { codeweaverScopeBlockTransformer } from '../codeweaver-scope-block/codeweaver-scope-block-transformer';
import { questPackageEntriesToTextTransformer } from '../quest-package-entries-to-text/quest-package-entries-to-text-transformer';
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

  // Relay path: resolve the work item's linked operation item and hand the agent its operation
  // plus the full ledger, so it can verify "this is the right next step" against git.
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

  // Bound the ledger render. The ledger is the one term in this block that grows without bound —
  // every `operationStatus: 'partial'` outcome appends a `pt N` continuation — and the block ships
  // through MCP, which SPILLS a tool result over `mcpToolResultStatics.maxVerbatimChars` to a file
  // and hands the agent an error stub instead. A prompt that loses its tail loses its gates and
  // numbered rules, so an over-budget block de-gates the agent silently.
  //
  // Elision runs from the OLDEST COMPLETED end only, and never touches the agent's own item or any
  // `in_progress` / `pending` item: a long tail of settled work from earlier in the relay carries
  // the least decision value, while an agent that cannot see the work still ahead of it cannot
  // verify it is the right next step. What survives keeps its original ordering AND its original
  // 1-based position, so the gap in the numbering is itself visible.
  const elidableCompletedIndexes = quest.operations.flatMap((operation, index) =>
    operation.status === 'complete' && operation.id !== linkedOperation.id ? [index] : [],
  );
  const alwaysRenderedCount = quest.operations.length - elidableCompletedIndexes.length;
  const recentCompletedSlots = Math.max(
    operationsLedgerRenderStatics.maxRenderedItems - alwaysRenderedCount,
    operationsLedgerRenderStatics.minRecentCompleteItems,
  );
  const elidedIndexes = elidableCompletedIndexes.slice(
    0,
    Math.max(elidableCompletedIndexes.length - recentCompletedSlots, 0),
  );
  const elidedIndexSet = new Set(elidedIndexes);
  const [firstElidedIndex] = elidedIndexes;

  const ledgerLines = quest.operations.flatMap((operation, index) => {
    // One notice stands in for the whole elided run, at the position of its first item. It names the
    // exact count and where the rest lives: a silent gap reads to an agent as "this is the whole
    // ledger", which is how a session concludes that work it never saw does not exist.
    if (elidedIndexSet.has(index)) {
      return index === firstElidedIndex
        ? [
            contentTextContract.parse(
              `... ${String(elidedIndexes.length)} earlier complete operation item${elidedIndexes.length === 1 ? '' : 's'} elided to fit the prompt budget — call get-quest({ questId, stage: 'implementation' }) for the full ledger.`,
            ),
          ]
        : [];
    }

    const marker =
      operation.status === 'complete' ? '[x]' : operation.status === 'in_progress' ? '[>]' : '[ ]';
    const wardMode = operation.wardMode === undefined ? '' : ` ${operation.wardMode}`;
    const yours = operation.id === linkedOperation.id ? '  <-- YOUR OPERATION ITEM' : '';
    return [
      contentTextContract.parse(
        `${String(index + 1)}. ${marker} [${operation.role}${wardMode}] ${String(operation.text)}${yours}`,
      ),
    ];
  });

  const parts: ContentText[] = [
    contentTextContract.parse(`Quest ID: ${String(quest.id)}`),
    contentTextContract.parse(`Work Item ID: ${String(workItem.id)}`),
    contentTextContract.parse(`Operation Item ID: ${String(linkedOperation.id)}`),
    contentTextContract.parse(
      `Your operation item: [${linkedOperation.role}] ${String(linkedOperation.text)}`,
    ),
    contentTextContract.parse(''),
    contentTextContract.parse('Operations ledger (in order):'),
    ...ledgerLines,
  ];

  // The ONE lookup both scope blocks below read. A role `signoffTrackEligibilityStatics.byTrack`
  // defines a denominator for is an OPERATOR: the completion gate measures its item against a
  // computed scope, so what the item declares is that scope rather than a reading order. Resolved
  // from the statics rather than a hand-written role list, so a track added there cannot silently
  // fall through to the advisory wording — which is exactly how groundstomper ended up being told
  // its one flow was "a starting point, NOT a boundary" while its gate measured it on that flow.
  const trackEligibility = new Map(Object.entries(signoffTrackEligibilityStatics.byTrack)).get(
    workItem.role,
  );
  const isSignoffTrackRole = trackEligibility !== undefined;

  // The flows this item lands on, with the caveat inline because the agent reads this block, not
  // the contract's describe(). What the pointer MEANS differs by role: an operator's item IS its
  // scope, so every flow listed is theirs to account for; every other role gets a non-binding
  // starting point, and treating it as a boundary is the failure mode to avoid (an item serving the
  // whole spec carries no flows at all). The caveat does NOT hand an operator the seams — a
  // flowrider item is a package slice and the glue units belong to the seam item, so a line
  // claiming them here would contradict the prompt it is interpolated into.
  if (linkedOperation.flowIds.length > 0) {
    parts.push(
      contentTextContract.parse(''),
      contentTextContract.parse(
        `${isSignoffTrackRole ? 'Your flows' : 'Flows your operation item lands on'}: ${linkedOperation.flowIds.map((flowId) => `#${String(flowId)}`).join(', ')}`,
      ),
      contentTextContract.parse(
        isSignoffTrackRole
          ? '(YOUR unit of accountability — every flow listed here, and no unit a sibling item owns. Not a starting point: work them, delegating where your role has minions.)'
          : '(A starting point, NOT a boundary — read every flow, and build whatever the flows need.)',
      ),
    );
  }

  // The packages this item lands in. This block is the highest-leverage line in the whole
  // substitution: without it every session re-derives its own landing site with `discover` and
  // `get-project-map` calls its siblings already made. It reads three ways, and the difference is
  // why each gets its own line. For an operator the list IS the coverage slice the completion gate
  // measures, and HOW it narrows is that track's own `packageScope` — a `partition` track's items
  // are the package dimension, so a glue unit belongs to the seam item; an `intersection` track's
  // are not, and it has no seam item, so telling one to disown its glue units would tell it to skip
  // exactly what its gate then refuses it for. For every other role the list is a pre-work reading
  // order, binding nothing.
  if (linkedOperation.packageNames.length > 0) {
    // A role with no track gets an advisory rather than a scope, and WHICH advisory turns on
    // whether it is served `operationOrchestratorPromptStatics`. That template's tool table is
    // EXHAUSTIVE and forbids `discover` / `get-project-map` outright, so naming them here would
    // hand the session a tool its own prompt banned a few screens earlier — and this is the line an
    // agent acts on. The orchestrator roles are exactly `roleToDisciplineStatics`' keys, read from
    // the map rather than listed, so a sixth discipline cannot fall through to the searching
    // wording. `spiritmender` and `warpgate` keep bespoke templates that DO tell them to search.
    const servedTheOrchestratorTemplate = new Map(Object.entries(roleToDisciplineStatics)).has(
      workItem.role,
    );
    const nonTrackPackageAdvisory = servedTheOrchestratorTemplate
      ? '(Name these packages in every minion brief you write — the planner and the workers point their own searches here instead of guessing. NOT a boundary: a minion may touch another package if the work needs it.)'
      : '(Read these packages BEFORE you search — point get-project-map and discover at them instead of guessing. NOT a boundary: touch another package if the work needs it.)';

    parts.push(
      contentTextContract.parse(''),
      contentTextContract.parse(
        `${isSignoffTrackRole ? 'Your packages' : 'Packages your operation item lands in'}: ${linkedOperation.packageNames.map((name) => String(name)).join(', ')}`,
      ),
      contentTextContract.parse(
        trackEligibility === undefined
          ? nonTrackPackageAdvisory
          : trackEligibility.packageScope === 'partition'
            ? '(YOUR coverage slice — you own every verification unit whose owning NODE tags one of these packages, and a unit spanning two of them belongs to the seam item, not to you. Read these packages first.)'
            : '(YOUR coverage slice — you own every verification unit whose owning NODE tags ANY of these packages, a unit spanning two of them included: your track has no seam item, so a glue unit is yours and nobody else claims it. Read these packages first.)',
      ),
    );
  }

  // Codeweaver only, and the reason its operation item can afford to be a bare label. The ledger
  // stores the cell key; the SCOPE — nodes, verbatim observables, contracts, the seams it sits on —
  // is rendered here from the quest as it stands at dispatch, so an observable a mid-quest session
  // ADDS reaches every codeweaver dispatched after it. Baked into `text` at Start it would not.
  if (workItem.role === 'codeweaver') {
    parts.push(...codeweaverScopeBlockTransformer({ quest, operationItem: linkedOperation }));
  }

  // Siegemaster only. Neither authoring role starts a server — Groundstomper's e2e run brings one
  // up from Playwright's own `webServer` config and tears it down again, and Flowrider never touches
  // a browser at all — so these lines would be dead context for both.
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

  // Quest-level background, appended last so the role's own operating context (item, ledger, dev
  // server, failed ward) stays at the top. Both fields live on the quest but in NO get-quest stage,
  // so without this they reach zero execution sessions. The request is the intent BEHIND the flows
  // — an agent repairing a gap the bucket partition missed needs to know what the flows are for.
  if (quest.packagesAffected.length > 0) {
    parts.push(
      contentTextContract.parse(''),
      contentTextContract.parse(
        `Packages affected (whole quest): ${String(questPackageEntriesToTextTransformer({ entries: quest.packagesAffected }))}`,
      ),
    );
  }
  parts.push(
    contentTextContract.parse(''),
    contentTextContract.parse('Original user request (the intent behind the flows):'),
    contentTextContract.parse(String(quest.userRequest)),
  );

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
