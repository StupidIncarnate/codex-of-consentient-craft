/**
 * PURPOSE: Harness for spawning a real Claude CLI session, collecting its stdout, and reading back
 * the on-disk session transcript so a test can assert what Claude Code actually recorded (e.g.
 * which SessionStart hook attachments landed, and in what order) instead of asking the spawned
 * model to self-report on its own system prompt — a self-report measured wrong roughly 1 time in 6.
 *
 * USAGE:
 * const harness = sessionSpawnHarness();
 * const { assistantText, exitCode, transcript } = await harness.spawnAndCollect({ prompt });
 * // transcript is the parsed contents of ~/.claude/projects/<encoded-cwd>/<sessionId>.jsonl
 */

import { createInterface } from 'readline';
import { readFile } from 'fs/promises';
import {
  absoluteFilePathContract,
  sessionIdContract,
  ExitCodeStub,
  FilePathStub,
  type AbsoluteFilePath,
  type SessionId,
} from '@dungeonmaster/shared/contracts';
import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import { osUserHomedirAdapter } from '@dungeonmaster/shared/adapters';
import { claudePathSlugEncoderTransformer } from '@dungeonmaster/shared/transformers';
import { ClaudeModelStub } from '../../../src/contracts/claude-model/claude-model.stub';
import { PromptTextStub } from '../../../src/contracts/prompt-text/prompt-text.stub';
import { childProcessSpawnStreamJsonAdapter } from '../../../src/adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter';

type ExitCode = ReturnType<typeof ExitCodeStub>;
type PromptText = ReturnType<typeof PromptTextStub>;
interface TranscriptEntry {
  type?: PromptText;
  attachment?: {
    type?: PromptText;
    hookEvent?: PromptText;
    exitCode?: ExitCode;
    content?: PromptText;
  };
}

// 60 x 250ms = 15s total budget. The transcript is written as the session runs, so a child that
// has just exited may not have flushed its last lines to disk yet — the same flush race the MCP
// package absorbs with a retry loop scanning sub-agent JSONL files (see
// claudeCodeParentSessionFindByToolUseIdBroker).
const MAX_TRANSCRIPT_ATTEMPTS = 60;
const TRANSCRIPT_POLL_INTERVAL_MS = 250;

const extractAssistantText = ({ lines }: { lines: PromptText[] }): PromptText => {
  const texts: PromptText[] = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(String(line)) as {
        type?: PromptText;
        message?: {
          role?: PromptText;
          content?: { type?: PromptText; text?: PromptText }[];
        };
      };
      const isAssistant = String(parsed.type) === 'assistant';
      const content = parsed.message?.content ?? [];
      for (const block of content) {
        const hasText = String(block.type) === 'text' && isAssistant;
        texts.push(PromptTextStub({ value: hasText ? String(block.text ?? '') : '' }));
      }
    } catch {
      // skip non-JSON lines
    }
  }
  return PromptTextStub({ value: texts.join('') });
};

const extractSessionId = ({ lines }: { lines: PromptText[] }): SessionId | undefined => {
  for (const line of lines) {
    try {
      const parsed = JSON.parse(String(line)) as { session_id?: SessionId };
      if (typeof parsed.session_id === 'string' && parsed.session_id.length > 0) {
        return sessionIdContract.parse(parsed.session_id);
      }
    } catch {
      // skip non-JSON lines
    }
  }
  return undefined;
};

const readTranscriptWithRetry = async ({
  transcriptPath,
  attemptsLeft = MAX_TRANSCRIPT_ATTEMPTS,
}: {
  transcriptPath: AbsoluteFilePath;
  // Internal: decrements on each tail-recursive retry. Callers should leave this at its default;
  // the function manages the count itself.
  attemptsLeft?: number;
}): Promise<TranscriptEntry[]> => {
  try {
    const contents = await readFile(String(transcriptPath), 'utf8');
    const entries = contents
      .split('\n')
      .filter((line) => line.length > 0)
      .map((line) => JSON.parse(line) as TranscriptEntry);
    if (entries.length === 0) {
      throw new Error(`Transcript at ${String(transcriptPath)} is empty`);
    }
    return entries;
  } catch (error) {
    if (attemptsLeft <= 1) {
      throw new Error(
        `Transcript never became readable at ${String(transcriptPath)} within ${
          MAX_TRANSCRIPT_ATTEMPTS * TRANSCRIPT_POLL_INTERVAL_MS
        }ms`,
        { cause: error },
      );
    }
    await new Promise<void>((resolve) => {
      setTimeout(resolve, TRANSCRIPT_POLL_INTERVAL_MS);
    });
    return readTranscriptWithRetry({ transcriptPath, attemptsLeft: attemptsLeft - 1 });
  }
};

export const sessionSpawnHarness = (): {
  spawnAndCollect: (params: { prompt: PromptText }) => Promise<{
    assistantText: PromptText;
    exitCode: ExitCode;
    transcript: TranscriptEntry[];
  }>;
} => ({
  spawnAndCollect: async ({
    prompt,
  }: {
    prompt: PromptText;
  }): Promise<{
    assistantText: PromptText;
    exitCode: ExitCode;
    transcript: TranscriptEntry[];
  }> =>
    new Promise((resolve, reject) => {
      const startPath = FilePathStub({ value: __dirname });
      cwdResolveBroker({ startPath, kind: 'repo-root' })
        .then((repoRoot) => {
          const { process: child, stdout } = childProcessSpawnStreamJsonAdapter({
            prompt,
            cwd: repoRoot,
            stdinMode: 'ignore',
            model: ClaudeModelStub({ value: 'haiku' }),
          });

          const collected: PromptText[] = [];
          const rl = createInterface({ input: stdout });
          rl.on('line', (line) => collected.push(PromptTextStub({ value: line })));

          child.on('exit', (code) => {
            rl.close();
            const exitCode = ExitCodeStub({ value: code ?? 0 });
            const assistantText = extractAssistantText({ lines: collected });
            const sessionId = extractSessionId({ lines: collected });
            if (sessionId === undefined) {
              reject(new Error('No session_id found on any collected stream-json line'));
              return;
            }

            const homeDir = osUserHomedirAdapter();
            const projectPath = absoluteFilePathContract.parse(String(repoRoot));
            const sessionsDir = claudePathSlugEncoderTransformer({ homeDir, projectPath });
            const transcriptPath = absoluteFilePathContract.parse(
              `${String(sessionsDir)}/${String(sessionId)}.jsonl`,
            );

            readTranscriptWithRetry({ transcriptPath })
              .then((transcript) => {
                resolve({ assistantText, exitCode, transcript });
              })
              .catch(reject);
          });

          child.on('error', (err) => {
            rl.close();
            reject(err);
          });
        })
        .catch(reject);
    }),
});
