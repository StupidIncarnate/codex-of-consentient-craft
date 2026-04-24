/**
 * PURPOSE: Drives a single smoketest scenario end-to-end — hydrates quest, registers scripts, starts scenario driver, kicks the orchestration loop, polls for terminal, runs assertions + optional teardown checks, and cleans up
 *
 * USAGE:
 * const result = await smoketestRunCaseBroker({
 *   scenario,
 *   guildId,
 *   startPath,
 *   timeoutMs: TimeoutMsStub({ value: 300_000 }),
 *   register: ({ questId, scripts }) => smoketestScenarioState.register({ questId, scripts }),
 *   unregister: ({ questId }) => smoketestScenarioState.unregister({ questId }),
 *   dispense: ({ questId, role }) => smoketestScenarioState.dispense({ questId, role }),
 *   subscribe: (handler) => orchestrationEventsState.on({ type: 'quest-modified', handler }),
 *   unsubscribe: (handler) => orchestrationEventsState.off({ type: 'quest-modified', handler }),
 *   startQuest: ({ questId }) => OrchestrationFlow.start({ questId }),
 * });
 * // Returns: SmoketestCaseResult { caseId, name, passed, durationMs, ... }
 *
 * WHEN-TO-USE: SmoketestRunResponder's suite dispatch — one call per scenario. Scenario scripts may be empty
 * (MCP/Signals suites pre-stamp prompt overrides at hydrate time via the blueprint), in which case the scenario
 * driver's dispense callback simply returns null and no stamping occurs. The responder must first ensure the
 * smoketest guild exists via smoketestEnsureGuildBroker and pass its returned guildId.
 *
 * WHY subscribe/unsubscribe/dispense/register/unregister/startQuest are injected:
 * brokers/ cannot import state/ or responders/. The caller (a responder that CAN import both) wires the real event
 * bus, the scenario-state dispense/register/unregister callbacks, and the OrchestrationFlow.start entry point.
 */

import { smoketestCaseResultContract } from '@dungeonmaster/shared/contracts';
import type {
  FilePath,
  GuildId,
  ProcessId,
  Quest,
  QuestId,
  SmoketestCaseResult,
  TimeoutMs,
  WorkItemRole,
} from '@dungeonmaster/shared/contracts';

import type { SmoketestScenario } from '../../../contracts/smoketest-scenario/smoketest-scenario-contract';
import type { SmoketestPromptName } from '../../../statics/smoketest-prompts/smoketest-prompts-statics';
import { questHydrateBroker } from '../../quest/hydrate/quest-hydrate-broker';
import { smoketestAssertFinalStateBroker } from '../assert-final-state/smoketest-assert-final-state-broker';
import { smoketestPollQuestUntilTerminalBroker } from '../poll-quest-until-terminal/smoketest-poll-quest-until-terminal-broker';
import { smoketestRunTeardownChecksBroker } from '../run-teardown-checks/smoketest-run-teardown-checks-broker';
import { smoketestScenarioDriverBroker } from '../scenario-driver/smoketest-scenario-driver-broker';
import { smoketestTeardownQuestBroker } from '../teardown-quest/smoketest-teardown-quest-broker';
import { buildCaseResultLayerBroker } from './build-case-result-layer-broker';

type QuestModifiedHandler = (event: {
  processId: ProcessId;
  payload: { questId?: unknown };
}) => void;

type ScriptsMap = Readonly<Partial<Record<WorkItemRole, readonly SmoketestPromptName[]>>>;

export const smoketestRunCaseBroker = async ({
  scenario,
  guildId,
  startPath,
  timeoutMs,
  register,
  unregister,
  dispense,
  subscribe,
  unsubscribe,
  startQuest,
}: {
  scenario: SmoketestScenario;
  guildId: GuildId;
  startPath: FilePath;
  timeoutMs: TimeoutMs;
  register: (params: { questId: QuestId; scripts: ScriptsMap }) => void;
  unregister: (params: { questId: QuestId }) => void;
  dispense: (params: { questId: QuestId; role: WorkItemRole }) => SmoketestPromptName | null;
  subscribe: (handler: QuestModifiedHandler) => void;
  unsubscribe: (handler: QuestModifiedHandler) => void;
  startQuest: (params: { questId: QuestId; startPath: FilePath }) => Promise<ProcessId>;
}): Promise<SmoketestCaseResult> => {
  const startedAt = Date.now();

  // Blueprint does NOT pin fixedQuestId — each orchestration case runs under a fresh quest id
  // so the hydrator + scenario-driver interact with isolated quest state per case.
  const { blueprint } = scenario;

  let questId: QuestId | null = null;
  let driverStop: (() => void) | null = null;

  try {
    const { questId: hydratedQuestId } = await questHydrateBroker({ blueprint, guildId });
    questId = hydratedQuestId;

    register({ questId, scripts: scenario.scripts });

    const boundQuestId = questId;
    const driver = await smoketestScenarioDriverBroker({
      questId: boundQuestId,
      dispense: ({ role }) => dispense({ questId: boundQuestId, role }),
      subscribe,
      unsubscribe,
    });
    driverStop = driver.stop;

    await startQuest({ questId, startPath });

    const finalQuest: Quest = await smoketestPollQuestUntilTerminalBroker({
      questId,
      timeoutMs,
      subscribe,
      unsubscribe,
    });

    const assertionOutcome = smoketestAssertFinalStateBroker({
      quest: finalQuest,
      assertions: scenario.assertions,
    });

    const teardownOutcome = await (scenario.postTeardownChecks === undefined
      ? Promise.resolve({ passed: true, failures: [] })
      : smoketestRunTeardownChecksBroker({ checks: scenario.postTeardownChecks }));

    return smoketestCaseResultContract.parse(
      buildCaseResultLayerBroker({
        scenario,
        startedAt,
        finalQuest,
        assertionFailures: assertionOutcome.failures,
        teardownFailures: teardownOutcome.failures,
      }),
    );
  } catch (error) {
    return smoketestCaseResultContract.parse({
      caseId: scenario.caseId,
      name: scenario.name,
      passed: false,
      durationMs: Date.now() - startedAt,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    if (driverStop !== null) {
      driverStop();
    }
    if (questId !== null) {
      unregister({ questId });
      try {
        await smoketestTeardownQuestBroker({ questId });
      } catch {
        // Teardown failures must not override the case result. Idempotent best-effort cleanup.
      }
    }
  }
};
