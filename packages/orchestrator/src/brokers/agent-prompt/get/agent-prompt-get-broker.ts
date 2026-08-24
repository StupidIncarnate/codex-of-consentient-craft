/**
 * PURPOSE: Resolves an agent name to its fully-substituted prompt for a dispatched agent
 * session. Loads the quest + the calling agent's work item, then delegates to
 * `workItemToPromptTransformer`, which resolves the work item's `operations/<id>` ref and
 * substitutes `$ARGUMENTS` in the prompt template with the operation-relay context.
 *
 * Broker-owned I/O: siegemaster stands up and owns a long-lived dev server for hands-on QA. The
 * broker resolves `.dungeonmaster.json` (`devServer.devCommand` + `devServer.port`) and hands the
 * command + URL to the transformer for that role only.
 *
 * Start-ref capture: the FIRST prompt fetch for a work item stamps `workItem.startRef` with the
 * quest worktree's HEAD sha, and no later fetch moves it. That sha is the base the signal-back
 * review-coverage gate rebuilds its blight checklist from, so it has to be recorded by the one
 * server-side surface every dispatched session passes through before it changes anything — the same
 * reason the MCP responder above stamps `sessionId`/`agentId` here rather than trusting the agent.
 *
 * Session id capture: this broker does NOT persist sessionId itself — MCP stdio carries
 * no per-call session metadata. The capture happens in the JSONL watcher: when each
 * Task-dispatched sub-agent's first user-text line lands (Claude CLI passes the parent's
 * Task.input.prompt verbatim), `start-subagent-tail-layer-broker` extracts the embedded
 * `workItemId: "<uuid>"` + `questId: "<uuid>"` and fires `onSessionIdLearned` with the
 * sub-agent's realAgentId as the sessionId. `quest-monitor-watcher-start-broker` wires
 * that hook to `questModifyBroker`, stamping `quest.workItems[workItemId].sessionId`.
 *
 * Discipline routing: a ROLE derives its discipline from its own role and must therefore REJECT a
 * `discipline` argument — accepting one would let a dispatched session request another discipline's
 * instructions. The three generic minions have no discipline of their own and REQUIRE one, because
 * the failure mode of serving them without it is an agent holding the literal token `$DISCIPLINE`
 * and running with no discipline instructions at all. Those three are also refused a `workItemId`
 * BY NAME rather than being let fall through to the work-item branch (which ignores `discipline`
 * and would report the wrong argument as the fault).
 *
 * USAGE:
 * const result = await agentPromptGetBroker({ agent: 'codeweaver', questId, workItemId });
 * // Returns AgentPromptResult whose `prompt` has $ARGUMENTS substituted with operation context
 */

import { pathJoinAdapter, processCwdAdapter } from '@dungeonmaster/shared/adapters';
import {
  agentPromptResultContract,
  filePathContract,
  workItemContract,
  type AgentPromptResult,
  type QuestId,
  type QuestWorkItemId,
} from '@dungeonmaster/shared/contracts';
import {
  dungeonmasterHomeStatics,
  environmentStatics,
  locationsStatics,
} from '@dungeonmaster/shared/statics';

import { dungeonmasterConfigResolveAdapter } from '../../../adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter';
import { gitHeadShaAdapter } from '../../../adapters/git/head-sha/git-head-sha-adapter';
import { agentPromptNameContract } from '../../../contracts/agent-prompt-name/agent-prompt-name-contract';
import { devCommandContract } from '../../../contracts/dev-command/dev-command-contract';
import { devServerUrlContract } from '../../../contracts/dev-server-url/dev-server-url-contract';
import { disciplineContract } from '../../../contracts/discipline/discipline-contract';
import { agentPromptClassificationStatics } from '../../../statics/agent-prompt-classification/agent-prompt-classification-statics';
import { agentNameToPromptTransformer } from '../../../transformers/agent-name-to-prompt/agent-name-to-prompt-transformer';
import { workItemToPromptTransformer } from '../../../transformers/work-item-to-prompt/work-item-to-prompt-transformer';
import { questCwdResolveBroker } from '../../quest/cwd-resolve/quest-cwd-resolve-broker';
import { questFindQuestPathBroker } from '../../quest/find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../../quest/load/quest-load-broker';
import { questOperationsUpdateBroker } from '../../quest/operations-update/quest-operations-update-broker';

export const agentPromptGetBroker = async ({
  agent,
  questId,
  workItemId,
  discipline,
}: {
  agent: string;
  questId: QuestId;
  workItemId?: QuestWorkItemId;
  discipline?: string;
}): Promise<AgentPromptResult> => {
  const parsedAgent = agentPromptNameContract.parse(agent);
  const isMinion = agentPromptClassificationStatics.minionNames.some(
    (name) => name === parsedAgent,
  );

  // A role's discipline is derived from its role and nowhere else. Letting the call carry one would
  // let a dispatched session fetch a sibling discipline's instructions for its own operation item.
  if (!isMinion && discipline !== undefined) {
    throw new Error(
      `agentPromptGetBroker: role "${parsedAgent}" must not be given a discipline — a role's discipline is derived from the role itself`,
    );
  }

  // `chaoswhisperer-gap-minion` is summoned during the SPEC phase, before any operation item
  // exists, so its template carries no $DISCIPLINE placeholder and a discipline handed to it
  // would silently go nowhere. The three generic minions are the mirror case: their whole
  // parameterization IS the discipline, and serving one without it hands the agent the literal
  // token and no instructions.
  const carriesDisciplinePlaceholder = isMinion && parsedAgent !== 'chaoswhisperer-gap-minion';

  // Minion-fetch: a parent-summoned sub-agent minion (every name in
  // agentPromptClassificationStatics.minionNames) has no work item of its own. It fetches its
  // served methodology with
  // { agent, questId } only; the parent briefs slice/task context inline in its Agent dispatch.
  // No quest load, no work-item context block. A ROLE name (dispatched as its own work item by
  // /dumpster-launch) MUST supply a workItemId — reject one that omits it.
  if (workItemId === undefined) {
    if (!isMinion) {
      throw new Error(`agentPromptGetBroker: role "${parsedAgent}" requires a workItemId`);
    }

    if (!carriesDisciplinePlaceholder && discipline !== undefined) {
      throw new Error(
        `agentPromptGetBroker: minion "${parsedAgent}" takes no discipline — it is summoned during the spec phase, before any operation item exists`,
      );
    }
    if (carriesDisciplinePlaceholder && discipline === undefined) {
      throw new Error(
        `agentPromptGetBroker: minion "${parsedAgent}" requires a discipline — one of: ${disciplineContract.options.join(' | ')}`,
      );
    }

    const minionBase = agentNameToPromptTransformer({
      agent: parsedAgent,
      ...(discipline === undefined ? {} : { discipline: disciplineContract.parse(discipline) }),
    });
    return agentPromptResultContract.parse({
      name: minionBase.name,
      model: minionBase.model,
      prompt: minionBase.prompt.replace('$ARGUMENTS', () => `Quest ID: ${String(questId)}`),
    });
  }

  // Past this point the caller is on the WORK-ITEM branch, which drops `discipline` entirely —
  // the prompt is parameterized off the work item's role instead. A generic minion arriving here
  // has passed a workItemId it must never pass, and saying so is the whole point: falling through
  // would refuse it for "no discipline", sending it to add the one argument that is not its
  // mistake. The workItemId is the mistake — it is what puts the caller inside
  // `subagentStopNeedsBlockGuard`, which then holds the minion's turn open until it calls
  // `signal-back`, and the only item it could signal on is its PARENT's operation item —
  // completing the parent's scope and advancing the relay while the parent is still working.
  if (carriesDisciplinePlaceholder) {
    throw new Error(
      `agentPromptGetBroker: minion "${parsedAgent}" must NOT be given a workItemId — not even its parent's. Fetch with { agent, questId, discipline } only: a workItemId puts the minion inside subagentStopNeedsBlockGuard, which holds its turn open until it calls signal-back, and the only item it could signal on is its parent's operation item — completing the parent's scope while the parent is still working`,
    );
  }

  const base = agentNameToPromptTransformer({ agent: parsedAgent });

  const { questPath } = await questFindQuestPathBroker({ questId });
  const questFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
  );
  const quest = await questLoadBroker({ questFilePath });

  const workItem = quest.workItems.find((item) => item.id === workItemId);
  if (workItem === undefined) {
    throw new Error(`agentPromptGetBroker: workItem ${workItemId} not found on quest ${questId}`);
  }

  // START REF — the fork point of THIS work item's own output, recorded before the session it is
  // being served can commit anything. `signal-back`'s review-coverage gate rebuilds the blight
  // checklist over `<startRef>..HEAD`, which is the only reading that sees a whole item: every
  // minion commits its own work as it goes, so by signal time the tree is clean, `HEAD~1` holds one
  // piece, and a `plan`-scoped reading holds one round.
  //
  // It is stamped ONCE and NEVER moved. A re-served prompt is the routine case — an orphan-recovery
  // resume, a redelivered fetch — and each one reads a HEAD that already contains the commits this
  // item made, so overwriting would silently shrink the reviewed range towards empty and the gate
  // would pass on a round nobody reviewed. Both the pre-check here and the re-check inside the
  // update callback are load-bearing: the first skips the git spawn on every fetch after the first,
  // the second is what makes it safe under the per-quest lock when two fetches race.
  //
  // THREE states record nothing, and each is real rather than a failure: a quest with no worktree
  // of its own (hydrated, or seeded before worktrees) has no checkout whose HEAD means anything
  // here; a recorded worktree missing on disk cannot be read; and `git rev-parse` on a checkout
  // with no commits answers nothing. The gate SKIPS an item with no `startRef` for exactly that
  // reason — it refuses an unreviewed range, never the absence of a range.
  //
  // BEST-EFFORT, exactly like the identity stamp the MCP responder above performs: the resolution
  // chain reaches the guild registry and the filesystem, and neither is this call's subject. A
  // prompt fetch that DIED because the fork point could not be recorded would take the whole
  // dispatch with it, to protect a gate that already treats a missing `startRef` as a skip.
  if (workItem.startRef === undefined) {
    try {
      const resolution = await questCwdResolveBroker({ questId });
      const startRef =
        resolution.kind === 'worktree' ? await gitHeadShaAdapter({ cwd: resolution.cwd }) : null;

      if (startRef !== null) {
        await questOperationsUpdateBroker({
          questId,
          update: ({ quest: current }) => {
            const target = current.workItems.find((item) => item.id === workItemId);
            if (target === undefined || target.startRef !== undefined) {
              return null;
            }
            return {
              workItems: current.workItems.map((item) =>
                item.id === workItemId ? workItemContract.parse({ ...item, startRef }) : item,
              ),
            };
          },
        });
      }
    } catch (error: unknown) {
      process.stderr.write(
        `[get-agent-prompt] start-ref stamp failed for work item ${String(workItemId)} on quest ${String(questId)}: ${error instanceof Error ? error.message : String(error)}\n`,
      );
    }
  }

  // Siegemaster ALONE gets the dev server. It stands a long-lived one up by hand at its Gate 5,
  // drives it, and tears it down before signalling, so it needs the real command and URL.
  // Flowrider deliberately does NOT: it never starts a server. Its e2e server is whatever the
  // project's Playwright config declares in `webServer`, started inside the run and torn down with
  // it, and its tests navigate `baseURL`-relative — so neither value has a consumer. Handing them
  // over invited a minion to author a `webServer` block into the shared config, which is install
  // scaffolding rather than a test and races when bundles run in parallel.
  const devServer = await (async (): Promise<
    Parameters<typeof workItemToPromptTransformer>[0]['devServer']
  > => {
    if (workItem.role !== 'siegemaster') {
      return undefined;
    }
    // The config-find chain dirname()s startPath on its first iteration — it expects a FILE, so it
    // can search the file's containing directory. Hand it the repo-root config file itself
    // (<cwd>/.dungeonmaster.json), NOT the bare cwd directory: a bare directory dirname()s to cwd's
    // PARENT, walks above the repo root, misses the config, and silently drops dev-server injection.
    const startPath = filePathContract.parse(
      pathJoinAdapter({
        paths: [processCwdAdapter(), dungeonmasterHomeStatics.paths.projectConfigFile],
      }),
    );
    // Absence of a config file (ConfigNotFoundError) is a legitimate "no dev server" state; any
    // other error (malformed JSON, validation, permissions) MUST surface.
    const config = await (async () => {
      try {
        return await dungeonmasterConfigResolveAdapter({ startPath });
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'ConfigNotFoundError') {
          return null;
        }
        throw error;
      }
    })();
    if (config?.devServer === undefined) {
      return undefined;
    }
    // `webPort` when the project declares one, `port` otherwise. This value is the URL a
    // hands-on QA session LOADS IN A BROWSER — `disciplineManualQaStatics` sends its workers
    // straight to it to click real elements — so on a project that serves its API and its app on
    // different ports, `port` is the wrong one and the walk lands on an API that renders nothing.
    // The single-server shape declares no `webPort` and is unaffected.
    const { devCommand, port, webPort } = config.devServer;
    return {
      devCommand: devCommandContract.parse(devCommand),
      devServerUrl: devServerUrlContract.parse(
        `http://${environmentStatics.hostname}:${String(webPort ?? port)}`,
      ),
    };
  })();

  const { prompt } = workItemToPromptTransformer({
    quest,
    workItem,
    agentName: parsedAgent,
    ...(devServer === undefined ? {} : { devServer }),
  });

  return agentPromptResultContract.parse({
    name: base.name,
    model: base.model,
    prompt,
  });
};
