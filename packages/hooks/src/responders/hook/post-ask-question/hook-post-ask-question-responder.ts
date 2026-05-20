/**
 * PURPOSE: Handles PostToolUse hook events for the native AskUserQuestion tool — resolves the
 * quest by session_id and PATCHes a DesignDecision per answered question onto it. On any real
 * failure (server down, 404, PATCH error, missing tool_response), exits 2 so Claude sees the
 * stderr and can react — silent failure would leave ChaosWhisperer's spec-building flow
 * thinking design decisions are persisted when they aren't.
 *
 * USAGE:
 * const result = await HookPostAskQuestionResponder({ inputData: rawHookJson });
 * // Returns ExecResult with stdout/stderr/exitCode — 0 on success, 2 on real failure
 */

import { portResolveBroker } from '@dungeonmaster/shared/brokers';
import { environmentStatics } from '@dungeonmaster/shared/statics';
import { fetchGetAdapter } from '@dungeonmaster/shared/adapters';
import { askUserQuestionResponseContract } from '@dungeonmaster/shared/contracts';

import {
  execResultContract,
  type ExecResult,
} from '../../../contracts/exec-result/exec-result-contract';
import { postToolUseHookDataContract } from '../../../contracts/post-tool-use-hook-data/post-tool-use-hook-data-contract';
import {
  questBySessionResponseContract,
  type QuestBySessionResponse,
} from '../../../contracts/quest-by-session-response/quest-by-session-response-contract';
import { fetchPatchAdapter } from '../../../adapters/fetch/patch/fetch-patch-adapter';
import { hookExitCodeStatics } from '../../../statics/hook-exit-code/hook-exit-code-statics';
import { askQuestionToDesignDecisionsTransformer } from '../../../transformers/ask-question-to-design-decisions/ask-question-to-design-decisions-transformer';

export const HookPostAskQuestionResponder = async ({
  inputData,
}: {
  inputData: string;
}): Promise<ExecResult> => {
  const okResult = execResultContract.parse({ stdout: '', stderr: '', exitCode: 0 });

  const hookParsed = postToolUseHookDataContract.safeParse(JSON.parse(inputData));
  if (!hookParsed.success) {
    const message = `invalid hook payload: ${hookParsed.error.message}`;
    process.stderr.write(`[post-ask-question] ${message}\n`);
    return execResultContract.parse({
      stdout: '',
      stderr: message,
      exitCode: hookExitCodeStatics.blockingFailure,
    });
  }

  const hookData = hookParsed.data;

  if (String(hookData.tool_name) !== 'AskUserQuestion') {
    return okResult;
  }

  // Claude Code's AskUserQuestion PostToolUse payload nests the answers map under tool_response.answers
  // (and mirrors it under tool_input.answers). The shared askUserQuestionResponseContract validates
  // the full {questions, answers} shape so we get typed access instead of casts.
  const responseParsed = askUserQuestionResponseContract.safeParse(hookData.tool_response);
  if (!responseParsed.success) {
    process.stderr.write(
      `[post-ask-question] invalid AskUserQuestion tool_response shape: ${responseParsed.error.message}\n`,
    );
    return execResultContract.parse({
      stdout: '',
      stderr: 'invalid AskUserQuestion tool_response shape (see stderr above)',
      exitCode: hookExitCodeStatics.blockingFailure,
    });
  }
  const { answers } = responseParsed.data;

  const port = portResolveBroker();
  const baseUrl = `http://${environmentStatics.hostname}:${String(port)}`;
  const sessionId = String(hookData.session_id);

  const sessionFetch: QuestBySessionResponse | null = await fetchGetAdapter<unknown>({
    url: `${baseUrl}/api/quests/by-session/${sessionId}`,
  })
    .then((raw) => questBySessionResponseContract.parse(raw))
    .catch((error: unknown) => {
      const cause = error instanceof Error ? error.message : String(error);
      const url = `${baseUrl}/api/quests/by-session/${sessionId}`;
      process.stderr.write(`[post-ask-question] quest lookup failed at ${url}: ${cause}\n`);
      return null;
    });
  if (sessionFetch === null) {
    return execResultContract.parse({
      stdout: '',
      stderr: 'quest lookup failed (see stderr above)',
      exitCode: hookExitCodeStatics.blockingFailure,
    });
  }
  const { questId } = sessionFetch;

  const designDecisions = askQuestionToDesignDecisionsTransformer({
    toolInput: hookData.tool_input,
    answers,
    nowMs: Date.now(),
  });

  if (designDecisions.length === 0) {
    const message = 'no answers matched questions, nothing to PATCH';
    process.stderr.write(`[post-ask-question] ${message}\n`);
    return execResultContract.parse({
      stdout: '',
      stderr: message,
      exitCode: hookExitCodeStatics.blockingFailure,
    });
  }

  try {
    await fetchPatchAdapter({
      url: `${baseUrl}/api/quests/${String(questId)}`,
      body: { designDecisions },
    });
  } catch (error: unknown) {
    const cause = error instanceof Error ? error.message : String(error);
    const message = `PATCH /api/quests/${String(questId)} failed: ${cause}`;
    process.stderr.write(`[post-ask-question] ${message}\n`);
    return execResultContract.parse({
      stdout: '',
      stderr: message,
      exitCode: hookExitCodeStatics.blockingFailure,
    });
  }

  return okResult;
};
