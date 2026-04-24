/**
 * PURPOSE: Executes a smoketest suite in-process — Orchestration cases drive a full scripted scenario through the real orchestration loop; MCP / Signals suites are temporarily inert (Phase 7 will enqueue them through the quest queue)
 *
 * USAGE:
 * const result = await SmoketestRunResponder({ suite, startPath });
 * // Returns: { runId, results: SmoketestCaseResult[] }
 */

import { filePathContract, smoketestRunIdContract } from '@dungeonmaster/shared/contracts';
import type {
  FilePath,
  GuildId,
  ProcessId,
  QuestId,
  SmoketestCaseResult,
  SmoketestRunId,
  SmoketestSuite,
  WorkItemRole,
} from '@dungeonmaster/shared/contracts';

import {
  smoketestScenarioContract,
  type SmoketestScenario,
} from '../../../contracts/smoketest-scenario/smoketest-scenario-contract';
import { smoketestCaseCatalogStatics } from '../../../statics/smoketest-case-catalog/smoketest-case-catalog-statics';
import type { SmoketestPromptName } from '../../../statics/smoketest-prompts/smoketest-prompts-statics';
import { smoketestStatics } from '../../../statics/smoketest/smoketest-statics';
import { smoketestEnsureGuildBroker } from '../../../brokers/smoketest/ensure-guild/smoketest-ensure-guild-broker';
import { smoketestRunCaseBroker } from '../../../brokers/smoketest/run-case/smoketest-run-case-broker';
import { questOrchestrationLoopBroker } from '../../../brokers/quest/orchestration-loop/quest-orchestration-loop-broker';
import { smoketestRunState } from '../../../state/smoketest-run/smoketest-run-state';
import { smoketestScenarioState } from '../../../state/smoketest-scenario/smoketest-scenario-state';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { processIdContract, timeoutMsContract } from '@dungeonmaster/shared/contracts';

type QuestModifiedHandler = (event: {
  processId: ProcessId;
  payload: { questId?: unknown };
}) => void;

export const SmoketestRunResponder = async ({
  suite,
  startPath,
}: {
  suite: SmoketestSuite;
  startPath: FilePath;
}): Promise<{ runId: SmoketestRunId; results: readonly SmoketestCaseResult[] }> => {
  const existing = smoketestRunState.getActive();
  if (existing !== null) {
    throw new Error(`Smoketest already running (runId=${existing.runId}, suite=${existing.suite})`);
  }

  const runId = smoketestRunIdContract.parse(crypto.randomUUID());
  smoketestRunState.start({ runId, suite });

  try {
    const resolvedStartPath = filePathContract.parse(startPath);
    const processId = processIdContract.parse(`smoketest-${runId}`);
    const orchestrationTimeoutMs = timeoutMsContract.parse(
      smoketestStatics.orchestrationCaseTimeoutMs,
    );

    // Phase 7 rewrites this responder to bundle MCP/Signals case catalogs into one blueprint per
    // suite via caseCatalogToBlueprintTransformer and enqueue them on the quest execution queue.
    // Until that lands, MCP/Signals suites are inert — no cases run, no results are produced.
    // Orchestration suite still runs end-to-end through smoketestRunCaseBroker.
    const orchestrationCases: readonly SmoketestScenario[] =
      suite === 'orchestration' || suite === 'all'
        ? smoketestCaseCatalogStatics.orchestration.map((scenario) =>
            smoketestScenarioContract.parse(scenario),
          )
        : [];

    const totalCases = orchestrationCases.length;

    orchestrationEventsState.emit({
      type: 'smoketest-progress',
      processId,
      payload: { runId, suite, phase: 'started', total: totalCases },
    });

    const singleResults: readonly SmoketestCaseResult[] = [];

    // Ensure the smoketest guild exists before dispatching any orchestration case. The hydrator,
    // quest-modify, and orchestration-loop all expect the guildId to resolve to a real guild in
    // the dungeonmaster config (for paths and for chat/orchestration bookkeeping). smoketestStatics.guildId
    // is a documentation constant that may appear in MCP prompts, but it is NOT guaranteed to match
    // any real guild id — the responder uses the actual guildId returned here.
    const ensuredGuildId: GuildId | null =
      orchestrationCases.length > 0 ? (await smoketestEnsureGuildBroker()).guildId : null;

    const orchResults = await orchestrationCases.reduce<Promise<readonly SmoketestCaseResult[]>>(
      async (prevPromise, scenario) => {
        const prevResults = await prevPromise;

        if (ensuredGuildId === null) {
          throw new Error(
            'SmoketestRunResponder: orchestration suite dispatch requires an ensured guildId',
          );
        }

        orchestrationEventsState.emit({
          type: 'smoketest-progress',
          processId,
          payload: {
            runId,
            suite,
            phase: 'case-started',
            caseId: scenario.caseId,
            name: scenario.name,
          },
        });

        const result = await smoketestRunCaseBroker({
          scenario,
          guildId: ensuredGuildId,
          startPath: resolvedStartPath,
          timeoutMs: orchestrationTimeoutMs,
          register: ({ questId, scripts }) => {
            smoketestScenarioState.register({ questId, scripts });
          },
          unregister: ({ questId }) => {
            smoketestScenarioState.unregister({ questId });
          },
          dispense: ({
            questId,
            role,
          }: {
            questId: QuestId;
            role: WorkItemRole;
          }): SmoketestPromptName | null => smoketestScenarioState.dispense({ questId, role }),
          subscribe: (handler: QuestModifiedHandler) => {
            orchestrationEventsState.on({ type: 'quest-modified', handler });
          },
          unsubscribe: (handler: QuestModifiedHandler) => {
            orchestrationEventsState.off({ type: 'quest-modified', handler });
          },
          startQuest: async ({ questId, startPath: loopStartPath }) => {
            const caseProcessId = processIdContract.parse(`smoketest-proc-${crypto.randomUUID()}`);
            const abortController = new AbortController();

            orchestrationProcessesState.register({
              orchestrationProcess: {
                processId: caseProcessId,
                questId,
                kill: () => {
                  abortController.abort();
                },
              },
            });

            questOrchestrationLoopBroker({
              processId: caseProcessId,
              questId,
              startPath: loopStartPath,
              onAgentEntry: () => {
                // smoketest orchestration cases do not stream chat entries — drawer shows pass/fail only.
              },
              abortSignal: abortController.signal,
            })
              .then(() => {
                orchestrationProcessesState.remove({ processId: caseProcessId });
              })
              .catch((error: unknown) => {
                process.stderr.write(
                  `smoketest orchestration loop failed for quest ${questId}: ${error instanceof Error ? error.message : 'Unknown error'}\n`,
                );
                orchestrationProcessesState.remove({ processId: caseProcessId });
              });

            return Promise.resolve(caseProcessId);
          },
        });

        smoketestRunState.appendEvent({ event: result });

        orchestrationEventsState.emit({
          type: 'smoketest-progress',
          processId,
          payload: { runId, suite, phase: 'case-complete', caseResult: result },
        });

        return [...prevResults, result];
      },
      Promise.resolve([]),
    );

    const results: readonly SmoketestCaseResult[] = [...singleResults, ...orchResults];

    orchestrationEventsState.emit({
      type: 'smoketest-progress',
      processId,
      payload: {
        runId,
        suite,
        phase: 'complete',
        total: results.length,
        passed: results.filter((r) => r.passed).length,
      },
    });

    return { runId, results };
  } finally {
    smoketestRunState.end();
  }
};
