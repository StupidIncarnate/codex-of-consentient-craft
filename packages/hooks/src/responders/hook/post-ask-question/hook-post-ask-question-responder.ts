/**
 * PURPOSE: Handles PostToolUse hook events for the native AskUserQuestion tool — resolves the
 * quest by session_id and PATCHes a DesignDecision per answered question onto it. The hook
 * is installed globally, so it fires for every Claude Code session on the machine. To avoid
 * interrupting non-Chaos sessions, two outcomes silently no-op (exit 0): (a) the server
 * returns 404 — sessionId is not a Chaos quest's chaoswhisperer workItem; (b) the GET fails
 * at the connection layer — no dungeonmaster server is running here, so this can't be Chaos
 * (Chaos sub-agents only run while the orchestrator+server are alive together). Exit 2
 * (blocking) is reserved for confirmed-Chaos sessions where persistence broke: 5xx on
 * lookup, malformed response shape, or PATCH failure — silent failure would leave
 * ChaosWhisperer's spec-building flow thinking decisions are persisted when they aren't.
 *
 * USAGE:
 * const result = await HookPostAskQuestionResponder({ inputData: rawHookJson });
 * // Returns ExecResult with stdout/stderr/exitCode — 0 on success or non-Chaos no-op, 2 on real failure
 */

import { portResolveBroker } from '@dungeonmaster/shared/brokers';
import { environmentStatics } from '@dungeonmaster/shared/statics';
import { askUserQuestionResponseContract } from '@dungeonmaster/shared/contracts';

import {
  execResultContract,
  type ExecResult,
} from '../../../contracts/exec-result/exec-result-contract';
import { postToolUseHookDataContract } from '../../../contracts/post-tool-use-hook-data/post-tool-use-hook-data-contract';
import { questBySessionResponseContract } from '../../../contracts/quest-by-session-response/quest-by-session-response-contract';
import { fetchGetWithStatusAdapter } from '../../../adapters/fetch/get-with-status/fetch-get-with-status-adapter';
import { fetchPatchAdapter } from '../../../adapters/fetch/patch/fetch-patch-adapter';
import { hookExitCodeStatics } from '../../../statics/hook-exit-code/hook-exit-code-statics';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
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
  const url = `${baseUrl}/api/quests/by-session/${sessionId}`;

  // Connection-level failure (server not running) is silent no-op — this session is not
  // Chaos. Chaos sub-agents only run while the orchestrator+server are alive together.
  const lookupResult = await fetchGetWithStatusAdapter({ url }).catch((): null => null);
  if (lookupResult === null) {
    return okResult;
  }

  if (lookupResult.status === httpStatusStatics.notFound) {
    // Server says no Chaos quest matches this session — generic Claude session. Silent no-op.
    return okResult;
  }

  if (!lookupResult.ok) {
    const message = `quest lookup failed at ${url}: status ${String(lookupResult.status)}`;
    process.stderr.write(`[post-ask-question] ${message}\n`);
    return execResultContract.parse({
      stdout: '',
      stderr: message,
      exitCode: hookExitCodeStatics.blockingFailure,
    });
  }

  const sessionParsed = questBySessionResponseContract.safeParse(lookupResult.body);
  if (!sessionParsed.success) {
    const message = `quest lookup at ${url} returned invalid shape: ${sessionParsed.error.message}`;
    process.stderr.write(`[post-ask-question] ${message}\n`);
    return execResultContract.parse({
      stdout: '',
      stderr: message,
      exitCode: hookExitCodeStatics.blockingFailure,
    });
  }
  const { questId } = sessionParsed.data;

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
