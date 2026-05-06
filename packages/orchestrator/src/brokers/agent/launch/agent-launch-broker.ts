/**
 * PURPOSE: Unified spawn harness — composes `agentSpawnUnifiedBroker`, `chatStreamProcessHandleBroker`, and `chatMainSessionTailBroker` (via the post-exit tail layer) into one entry point so EVERY agent (chaoswhisperer, glyphsmith, pathseeker, codeweaver, lawbringer, siegemaster, spiritmender, blightwarden) launches the same way and is individually addressable for future per-agent message-injection. Process-state registration lives at the responder layer; the launcher exposes its composed `kill` for the responder to attach via `registerProcess`.
 *
 * USAGE:
 * const { processId, handle, kill, sessionId$ } = agentLaunchBroker({
 *   role,
 *   guildId,
 *   questId,
 *   questWorkItemId,
 *   processIdPrefix: 'proc',
 *   prompt,
 *   cwd,
 *   model,
 *   onEntries: ({ chatProcessId, entries, sessionId }) => { },
 *   onText: ({ chatProcessId, text }) => { },
 *   onSignal: ({ chatProcessId, signal }) => { },
 *   onSessionId: ({ chatProcessId, sessionId }) => { },
 *   onComplete: ({ chatProcessId, exitCode, sessionId }) => { },
 *   registerProcess: ({ processId, questId, questWorkItemId, kill }) => { },
 * });
 */

import type {
  ChatEntry,
  ExitCode,
  GuildId,
  ProcessId,
  QuestId,
  QuestWorkItemId,
  RepoRootCwd,
  SessionId,
} from '@dungeonmaster/shared/contracts';
import { processIdContract } from '@dungeonmaster/shared/contracts';

import type { ClaudeModel } from '../../../contracts/claude-model/claude-model-contract';
import type { ProcessIdPrefix } from '../../../contracts/process-id-prefix/process-id-prefix-contract';
import type { PromptText } from '../../../contracts/prompt-text/prompt-text-contract';
import type { StreamSignal } from '../../../contracts/stream-signal/stream-signal-contract';
import type { StreamText } from '../../../contracts/stream-text/stream-text-contract';
import { chatStreamProcessHandleBroker } from '../../chat/stream-process-handle/chat-stream-process-handle-broker';
import { agentSpawnUnifiedBroker } from '../spawn-unified/agent-spawn-unified-broker';
import { composeKillLayerBroker } from './compose-kill-layer-broker';
import { startMainTailLayerBroker } from './start-main-tail-layer-broker';

export const agentLaunchBroker = ({
  guildId,
  questId,
  questWorkItemId,
  processIdPrefix,
  prompt,
  cwd,
  model,
  resumeSessionId,
  disableToolSearch,
  onEntries,
  onText,
  onSignal,
  onSessionId,
  onComplete,
  registerProcess,
  abortSignal,
}: {
  guildId: GuildId;
  // questId + questWorkItemId are forwarded to `registerProcess` only. Chat-spawn callers
  // pass them so the orchestration-processes registry can locate this agent later. Loop
  // layer brokers omit them today (loop-level processId already carries the kill switch).
  questId?: QuestId;
  questWorkItemId?: QuestWorkItemId;
  processIdPrefix: ProcessIdPrefix;

  prompt: PromptText;
  cwd: RepoRootCwd;
  model: ClaudeModel;
  resumeSessionId?: SessionId;
  disableToolSearch?: boolean;

  onEntries: (params: {
    chatProcessId: ProcessId;
    entries: ChatEntry[];
    sessionId: SessionId | undefined;
  }) => void;
  onText: (params: { chatProcessId: ProcessId; text: StreamText }) => void;
  onSignal: (params: { chatProcessId: ProcessId; signal: StreamSignal }) => void;
  onSessionId: (params: { chatProcessId: ProcessId; sessionId: SessionId }) => void;
  onComplete: (params: {
    chatProcessId: ProcessId;
    exitCode: ExitCode | null;
    sessionId: SessionId | null;
  }) => void;

  // Caller (responder) registers the process in `orchestrationProcessesState` with
  // `{ processId, questId, questWorkItemId, kill }` so a future per-agent message-injection
  // endpoint can find this specific running agent. State mutation lives at the responder
  // layer per architecture; the launcher hands the composed `kill` over via this callback.
  // Optional: orchestration-loop layer brokers do not register per-work-item today (the
  // loop-level processId carries the kill switch); only chat-spawn sites register.
  registerProcess?: (params: {
    processId: ProcessId;
    questId: QuestId;
    questWorkItemId: QuestWorkItemId;
    kill: () => void;
  }) => void;

  abortSignal?: AbortSignal;
}): {
  processId: ProcessId;
  handle: ReturnType<typeof chatStreamProcessHandleBroker>;
  kill: () => void;
  sessionId$: Promise<SessionId | null>;
} => {
  const processId = processIdContract.parse(`${processIdPrefix}-${crypto.randomUUID()}`);

  // Tail stop slot for post-exit JSONL appends. Wired lazily inside the spawn's
  // `onComplete` (after the CLI exits, when the file has been fully written by the live
  // stream). Map (class-instantiated) instead of an object literal so the layer broker's
  // tests stay free of inline-object stubs while the launcher itself can populate one
  // slot when the tail comes up.
  const tailStopMap = new Map<'stop', () => void>();
  // Killed-state tracker. The post-exit tail starts asynchronously in `onComplete`'s
  // `.then` chain; if the caller kills the launch (e.g. the chat-start-responder finds a
  // running process for the resumed quest and kills it before spawning the next turn)
  // BEFORE the tail's startup Promise resolves, the kill misses the tail entirely. The
  // tail then starts with no stop registered, lives on, and emits the next turn's JSONL
  // appends — duplicating what stdout streamed. Set is sized 0 (not killed) or 1
  // (killed); checked inside the tail-startup `.then` so a late-arriving stop fires
  // immediately when the launcher is already killed.
  const killedStateSet = new Set<'killed'>();

  const handle = chatStreamProcessHandleBroker({
    chatProcessId: processId,
    guildId,
    ...(resumeSessionId === undefined ? {} : { sessionId: resumeSessionId }),
    onEntries,
    onText,
    onSignal,
  });

  const spawnParams: Parameters<typeof agentSpawnUnifiedBroker>[0] = {
    prompt,
    cwd,
    model,
    onLine: ({ line }): void => {
      handle.onLine({ rawLine: line });
    },
    onComplete: ({ exitCode, sessionId: completedSessionId }): void => {
      // CLI exited. Do NOT stop the handle here — it owns the sub-agent tails, and for
      // `run_in_background` Tasks Claude CLI keeps writing the sub-agent JSONL after the
      // parent CLI exits. Stopping the tails here would cut off those late appends. The
      // streaming pipeline winds down naturally when readline closes (already torn down
      // by the CLI exit). Sub-agent tails plus the post-exit main-session tail (started
      // next) are stopped together via the composed kill the launcher hands to
      // `registerProcess` — that's the single teardown path.
      //
      // Start the main-session tail after CLI exit. `startPosition: 'end'` means the file
      // pointer is set at the current end-of-file at this point, so anything written
      // during streaming (already on the wire via stdout) is skipped — only NEW appends
      // are captured. Resolve the sid from the completed run, falling back to the
      // caller-supplied resumeSessionId when CLI didn't re-emit system/init.
      const resolvedSid = completedSessionId ?? resumeSessionId ?? null;
      if (resolvedSid !== null) {
        startMainTailLayerBroker({
          sessionId: resolvedSid,
          guildId,
          processor: handle.processor,
          chatProcessId: processId,
          onEntries,
        })
          .then((stop) => {
            // Race guard: if the launcher was killed BEFORE this Promise resolved (e.g.
            // chat-start-responder's resume path killed the prior process to clear the
            // way for the next turn), stop the tail immediately so it never picks up
            // the next turn's JSONL appends. Without this, the orphan tail watches the
            // same JSONL the new turn writes to, double-emitting every entry.
            if (killedStateSet.has('killed')) {
              stop();
              return;
            }
            tailStopMap.set('stop', stop);
          })
          .catch((error: unknown) => {
            process.stderr.write(
              `[agent-launch] post-exit main-tail wiring failed: ${error instanceof Error ? error.message : String(error)}\n`,
            );
          });
      }

      onComplete({ chatProcessId: processId, exitCode, sessionId: completedSessionId });
    },
  };

  if (resumeSessionId !== undefined) {
    spawnParams.resumeSessionId = resumeSessionId;
  }
  if (disableToolSearch !== undefined) {
    spawnParams.disableToolSearch = disableToolSearch;
  }

  const { kill: spawnKill, sessionId$ } = agentSpawnUnifiedBroker(spawnParams);

  // Compose the universal kill via a layer broker — assembles the spawn-kill + handle-stop
  // + tail-stop sequence into one function so the launcher can hand it to registerProcess,
  // the abort-signal listener, and the return value without nested function declarations.
  const kill = composeKillLayerBroker({
    spawnKill,
    handleStop: handle.stop,
    tailStopMap,
    killedStateSet,
  });

  if (registerProcess !== undefined && questId !== undefined && questWorkItemId !== undefined) {
    registerProcess({
      processId,
      questId,
      questWorkItemId,
      kill,
    });
  }

  // Surface sessionId the moment Claude CLI's system/init line resolves it. Falls back
  // to caller-supplied resumeSessionId when resuming (Claude CLI may not re-emit
  // system/init on resume so trackedSessionId stays null in spawn-unified-broker). The
  // post-exit main-session tail starts in `onComplete` above, NOT here — starting at
  // sessionId-resolution time would race the live stdout pipeline (the JSONL file is
  // being appended while the CLI runs; tailing from system/init forward would re-emit
  // every entry stdout already streamed).
  sessionId$
    .then((sid) => {
      const resolvedSid = sid ?? resumeSessionId ?? null;
      if (resolvedSid === null) return;
      onSessionId({ chatProcessId: processId, sessionId: resolvedSid });
    })
    .catch((error: unknown) => {
      process.stderr.write(
        `[agent-launch] sessionId resolve failed: ${error instanceof Error ? error.message : String(error)}\n`,
      );
    });

  if (abortSignal !== undefined) {
    if (abortSignal.aborted) {
      kill();
    } else {
      abortSignal.addEventListener('abort', kill, { once: true });
    }
  }

  return {
    processId,
    handle,
    kill,
    sessionId$,
  };
};
