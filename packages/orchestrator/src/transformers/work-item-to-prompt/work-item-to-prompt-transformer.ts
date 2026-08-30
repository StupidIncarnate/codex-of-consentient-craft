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
 * AN OPERATOR'S SPEC IS NOT IN THIS BLOCK. Each of the three operator roles gets the exact
 * `get-quest` call PER FLOW its item owns, spelled out with the ids substituted, and fetches its own
 * scope with it. Two tool results are two separate 50,000-character budgets; rendering the scope
 * inline measured 61,501 characters for one real item and spilled the whole prompt to a file.
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
import { questPackageEntriesToTextTransformer } from '@dungeonmaster/shared/transformers';

import { agentPromptNameContract } from '../../contracts/agent-prompt-name/agent-prompt-name-contract';
import { agentRoleContract } from '../../contracts/agent-role/agent-role-contract';
import { operationsLedgerRenderStatics } from '../../statics/operations-ledger-render/operations-ledger-render-statics';
import type { DevCommand } from '../../contracts/dev-command/dev-command-contract';
import type { DevServerUrl } from '../../contracts/dev-server-url/dev-server-url-contract';
import { signoffTrackEligibilityStatics } from '../../statics/signoff-track-eligibility/signoff-track-eligibility-statics';
import { agentNameToPromptTransformer } from '../agent-name-to-prompt/agent-name-to-prompt-transformer';
import { codeweaverScopeBlockTransformer } from '../codeweaver-scope-block/codeweaver-scope-block-transformer';
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
  // defines a denominator for is an OPERATOR: its item's declared flows/packages ARE that computed
  // scope, so what the item declares is that scope rather than a reading order. Resolved from the
  // statics rather than a hand-written role list, so a track added there cannot silently fall
  // through to the advisory wording — an operator told its one flow is "a starting point, NOT a
  // boundary" while its own coverage is measured on exactly that flow.
  const trackEligibility = new Map(Object.entries(signoffTrackEligibilityStatics.byTrack)).get(
    workItem.role,
  );
  const isSignoffTrackRole = trackEligibility !== undefined;

  // The flows this item lands on, with the caveat inline because the agent reads this block, not
  // the contract's describe(). What the pointer MEANS differs by role: an operator's item IS its
  // scope, so every flow listed is theirs to account for; every other role gets a non-binding
  // starting point, and treating it as a boundary is the failure mode to avoid (an item serving the
  // whole spec carries no flows at all).
  if (linkedOperation.flowIds.length > 0) {
    parts.push(
      contentTextContract.parse(''),
      contentTextContract.parse(
        `${isSignoffTrackRole ? 'Your flows' : 'Flows your operation item lands on'}: ${linkedOperation.flowIds.map((flowId) => `#${String(flowId)}`).join(', ')}`,
      ),
      contentTextContract.parse(
        isSignoffTrackRole
          ? '(YOUR unit of accountability — every flow listed here, and no unit a sibling item owns. Not a starting point: work them, delegating where the work is wider than one session.)'
          : '(A starting point, NOT a boundary — read every flow, and build whatever the flows need.)',
      ),
    );
  }

  // The packages this item lands in. This block is the highest-leverage line in the whole
  // substitution: without it every session re-derives its own landing site with `discover` and
  // `get-project-map` calls its siblings already made. It reads three ways, and the difference is
  // why each gets its own line. For an operator the list IS the coverage slice, and it narrows by
  // INTERSECTION (`packageScope`) — no track has a seam item, so a glue unit is the item's own and
  // telling it to disown one would tell it to skip exactly what its own track owns. For every other
  // role the list is a pre-work reading order, binding nothing.
  if (linkedOperation.packageNames.length > 0) {
    // A role with no track gets an advisory rather than a scope. Every role that briefs sub-agents
    // also owns a track — `signoffTrackEligibilityStatics.byTrack`'s keys ARE
    // `agentPromptClassificationStatics.operatorRoleNames` — so the advisory branch is reached only
    // by `spiritmender` and `warpgate`, whose bespoke prompts do tell them to search.
    parts.push(
      contentTextContract.parse(''),
      contentTextContract.parse(
        `${isSignoffTrackRole ? 'Your packages' : 'Packages your operation item lands in'}: ${linkedOperation.packageNames.map((name) => String(name)).join(', ')}`,
      ),
      contentTextContract.parse(
        trackEligibility === undefined
          ? '(Read these packages BEFORE you search — point get-project-map and discover at them instead of guessing. NOT a boundary: touch another package if the work needs it.)'
          : '(YOUR coverage slice — you own every verification unit whose owning NODE tags ANY of these packages, a unit spanning two of them included: your track has no seam item, so a glue unit is yours and nobody else claims it. Read these packages first.)',
      ),
    );
  }

  // THE SPEC IS A SECOND TOOL RESULT, NOT PART OF THIS ONE. Rendered inline, the `web` item of a
  // real quest measured 43,660 characters of scope — 61,501 with the prompt around it — against
  // `mcpToolResultStatics.maxVerbatimChars` (50,000), and an over-budget MCP result is written to a
  // file and answered with an error stub, so the session begins holding a path instead of its
  // instructions. A pointer costs a few hundred characters and buys the flow its own 50,000.
  //
  // The calls are SPELLED OUT rather than described, because a session that has to compose the call
  // itself composes `get-quest({ questId, stage: 'spec' })` — which is the 69,180-character render
  // this exists to avoid. Only the three operator roles get the block: they are the roles whose item
  // IS a flow scope (`signoffTrackEligibilityStatics.byTrack`), and `packageName` goes only to
  // codeweaver, whose item is one package's half of ONE flow — so its list is a single call, beside
  // the foundation call below.
  if (isSignoffTrackRole) {
    const packageArgument =
      workItem.role === 'codeweaver' && linkedOperation.packageNames[0] !== undefined
        ? `, packageName: '${String(linkedOperation.packageNames[0])}'`
        : '';
    const flowCalls = linkedOperation.flowIds.map((flowId) =>
      contentTextContract.parse(
        `  get-quest({ questId: '${String(quest.id)}', flowId: '${String(flowId)}'${packageArgument} })`,
      ),
    );
    // A codeweaver item routes contracts by PATH, so a package can own one anchored to a node on a
    // flow it does not tag — and a package with contracts and no tagged node has no flow call at
    // all. The foundation call is what reaches those, and it is the ONLY call such an item makes.
    const foundationCall =
      workItem.role === 'codeweaver' && linkedOperation.packageNames[0] !== undefined
        ? [
            contentTextContract.parse(
              `  get-quest({ questId: '${String(quest.id)}', packageName: '${String(linkedOperation.packageNames[0])}' })   <- every contract your package owns, across every flow`,
            ),
          ]
        : [];
    const calls =
      flowCalls.length === 0 && foundationCall.length === 0
        ? [
            contentTextContract.parse(
              `  get-quest({ questId: '${String(quest.id)}', stage: 'spec' })   <- this item names no flow, so there is no slice to take`,
            ),
          ]
        : [...flowCalls, ...foundationCall];

    parts.push(
      contentTextContract.parse(''),
      contentTextContract.parse('Your spec is NOT in this block. Fetch it one flow at a time:'),
      ...calls,
      contentTextContract.parse(
        'Each call returns that flow whole — every node, every edge with its branch label, every',
      ),
      contentTextContract.parse(
        'observable, the contracts and design decisions that govern it, and the sign-offs already',
      ),
      contentTextContract.parse('recorded. Make the call for a flow BEFORE you work it.'),
    );
  }

  // Codeweaver only, and the one thing about its scope no flow render can answer. A glue node's
  // other half belongs to a sibling item, and whether that session has already run is a fact about
  // the LEDGER — so "verify it exists" is only ever asked about code that could already exist.
  if (workItem.role === 'codeweaver') {
    parts.push(...codeweaverScopeBlockTransformer({ quest, operationItem: linkedOperation }));
  }

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

  // Quest-level background, appended last so the role's own operating context (item, ledger, dev
  // server, failed ward) stays at the top. Both fields live on the quest but in NO get-quest stage,
  // so without this they reach zero execution sessions. The request is the intent BEHIND the flows
  // — an agent repairing a gap the slicing missed needs to know what the flows are for.
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
