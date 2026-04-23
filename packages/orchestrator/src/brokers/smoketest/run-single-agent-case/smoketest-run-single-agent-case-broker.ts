/**
 * PURPOSE: Spawns a single Claude agent with a smoketest override prompt and returns a verified/failed case result based on whether the emitted signal matches the expected signal for the case
 *
 * USAGE:
 * const result = await smoketestRunSingleAgentCaseBroker({ caseId, name, prompt, expectedSignal: 'failed', startPath });
 * // Returns: SmoketestCaseResult with passed=true when the agent emits the expected signal
 *
 * WHY expectedSignal is a param: the Signals suite deliberately scripts the agent to emit `failed` or
 * `failed-replan`. For those cases `passed=true` means the agent emitted the expected signal (the surface
 * was verified) — not that the signal itself was `complete`.
 */

import {
  DependencyStepStub,
  QuestContractEntryStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';
import type { ChatEntry, FilePath } from '@dungeonmaster/shared/contracts';
import {
  smoketestCaseResultContract,
  type SmoketestCaseResult,
} from '@dungeonmaster/shared/contracts';
import { claudeLineNormalizeBroker } from '@dungeonmaster/shared/brokers';

import { agentSpawnByRoleBroker } from '../../agent/spawn-by-role/agent-spawn-by-role-broker';
import { questIdContract } from '@dungeonmaster/shared/contracts';
import type { PromptText } from '../../../contracts/prompt-text/prompt-text-contract';
import type { StreamSignal } from '../../../contracts/stream-signal/stream-signal-contract';
import { workUnitContract } from '../../../contracts/work-unit/work-unit-contract';
import { chatLineSourceContract } from '../../../contracts/chat-line-source/chat-line-source-contract';
import { chatLineProcessTransformer } from '../../../transformers/chat-line-process/chat-line-process-transformer';
import { smoketestStatics } from '../../../statics/smoketest/smoketest-statics';

const ERROR_TAIL_LINE_COUNT = 5;
const modelLabelContract = smoketestCaseResultContract.shape.model.unwrap();
const DEFAULT_MODEL_LABEL = modelLabelContract.parse('default');

export const smoketestRunSingleAgentCaseBroker = async ({
  caseId,
  name,
  prompt,
  expectedSignal,
  startPath,
}: {
  caseId: string;
  name: string;
  prompt: PromptText;
  expectedSignal: StreamSignal['signal'];
  startPath: FilePath;
}): Promise<SmoketestCaseResult> => {
  const startedAt = Date.now();
  const abortController = new AbortController();

  const workUnit = workUnitContract.parse({
    role: 'codeweaver',
    questId: questIdContract.parse(smoketestStatics.questId),
    steps: [
      DependencyStepStub({
        id: StepIdStub({ value: 'smoketest-placeholder-step' }),
        dependsOn: [],
      }),
    ],
    relatedContracts: [QuestContractEntryStub()],
    relatedObservables: [],
    relatedDesignDecisions: [],
    relatedFlows: [],
    smoketestPromptOverride: prompt,
  });

  const processor = chatLineProcessTransformer();
  const sessionSource = chatLineSourceContract.parse('session');
  const entries: ChatEntry[] = [];

  try {
    const result = await agentSpawnByRoleBroker({
      workUnit,
      startPath,
      abortSignal: abortController.signal,
      onLine: ({ line }) => {
        const parsed = claudeLineNormalizeBroker({ rawLine: line });
        const outputs = processor.processLine({ parsed, source: sessionSource });
        for (const output of outputs) {
          if (output.type === 'entries') {
            entries.push(...output.entries);
          }
        }
      },
    });

    const passed = result.signal !== null && result.signal.signal === expectedSignal;
    const durationMs = Date.now() - startedAt;
    const output = result.capturedOutput.slice(-ERROR_TAIL_LINE_COUNT).join('\n');
    const modelFromEntries = entries.find(
      (e): e is ChatEntry & { model: NonNullable<SmoketestCaseResult['model']> } =>
        'model' in e && typeof e.model === 'string' && e.model.length > 0,
    );
    const model =
      modelFromEntries === undefined
        ? DEFAULT_MODEL_LABEL
        : modelLabelContract.parse(modelFromEntries.model);

    if (result.signal === null) {
      const detail = `Agent exited without emitting a signal (exitCode=${String(result.exitCode)}, sessionId=${result.sessionId ?? 'none'}, lines=${String(result.capturedOutput.length)}, crashed=${String(result.crashed)}, expectedSignal=${expectedSignal})`;
      process.stderr.write(`[smoketest] ${caseId}: ${detail}\n`);
      return smoketestCaseResultContract.parse({
        caseId,
        name,
        passed,
        durationMs,
        errorMessage: detail,
        ...(output === '' ? {} : { output }),
        prompt,
        model,
        entries,
      });
    }

    const actualSignal = result.signal.signal;
    if (!passed) {
      const detail = `Agent emitted "${actualSignal}" but the case expected "${expectedSignal}"`;
      process.stderr.write(`[smoketest] ${caseId}: ${detail}\n`);
      return smoketestCaseResultContract.parse({
        caseId,
        name,
        passed,
        durationMs,
        errorMessage: detail,
        summary: result.signal.summary ?? actualSignal,
        ...(output === '' ? {} : { output }),
        prompt,
        model,
        entries,
      });
    }

    return smoketestCaseResultContract.parse({
      caseId,
      name,
      passed,
      durationMs,
      summary: result.signal.summary ?? actualSignal,
      ...(output === '' ? {} : { output }),
      prompt,
      model,
      entries,
    });
  } catch (error) {
    return smoketestCaseResultContract.parse({
      caseId,
      name,
      passed: false,
      durationMs: Date.now() - startedAt,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      prompt,
      model: DEFAULT_MODEL_LABEL,
      entries,
    });
  }
};
