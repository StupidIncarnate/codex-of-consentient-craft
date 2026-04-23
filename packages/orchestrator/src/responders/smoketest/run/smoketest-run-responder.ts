/**
 * PURPOSE: Executes a smoketest suite in-process — MCP / Signals cases run a single Claude agent; Orchestration cases drive a full scripted scenario through the real orchestration loop
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

import { promptTextContract } from '../../../contracts/prompt-text/prompt-text-contract';
import {
  smoketestScenarioContract,
  type SmoketestScenario,
} from '../../../contracts/smoketest-scenario/smoketest-scenario-contract';
import { smoketestCaseCatalogStatics } from '../../../statics/smoketest-case-catalog/smoketest-case-catalog-statics';
import { smoketestPromptsStatics } from '../../../statics/smoketest-prompts/smoketest-prompts-statics';
import type { SmoketestPromptName } from '../../../statics/smoketest-prompts/smoketest-prompts-statics';
import { smoketestStatics } from '../../../statics/smoketest/smoketest-statics';
import { smoketestEnsureGuildBroker } from '../../../brokers/smoketest/ensure-guild/smoketest-ensure-guild-broker';
import { smoketestRunOrchestrationCaseBroker } from '../../../brokers/smoketest/run-orchestration-case/smoketest-run-orchestration-case-broker';
import { smoketestRunSingleAgentCaseBroker } from '../../../brokers/smoketest/run-single-agent-case/smoketest-run-single-agent-case-broker';
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

    const singleAgentCases =
      suite === 'mcp'
        ? smoketestCaseCatalogStatics.mcp
        : suite === 'signals'
          ? smoketestCaseCatalogStatics.signals
          : suite === 'all'
            ? [...smoketestCaseCatalogStatics.mcp, ...smoketestCaseCatalogStatics.signals]
            : [];

    const orchestrationCases: readonly SmoketestScenario[] =
      suite === 'orchestration' || suite === 'all'
        ? smoketestCaseCatalogStatics.orchestration.map((scenario) =>
            smoketestScenarioContract.parse(scenario),
          )
        : [];

    const totalCases = singleAgentCases.length + orchestrationCases.length;

    orchestrationEventsState.emit({
      type: 'smoketest-progress',
      processId,
      payload: { runId, suite, phase: 'started', total: totalCases },
    });

    const singleResults = await singleAgentCases.reduce<Promise<readonly SmoketestCaseResult[]>>(
      async (prevPromise, caseDef) => {
        const prevResults = await prevPromise;

        orchestrationEventsState.emit({
          type: 'smoketest-progress',
          processId,
          payload: {
            runId,
            suite,
            phase: 'case-started',
            caseId: caseDef.caseId,
            name: caseDef.name,
          },
        });

        const prompt = promptTextContract.parse(
          Reflect.get(smoketestPromptsStatics, caseDef.promptKey),
        );
        const result = await smoketestRunSingleAgentCaseBroker({
          caseId: caseDef.caseId,
          name: caseDef.name,
          prompt,
          expectedSignal: caseDef.expectedSignal,
          startPath: resolvedStartPath,
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

        const result = await smoketestRunOrchestrationCaseBroker({
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
