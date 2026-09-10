/**
 * PURPOSE: Harness for the two halves of the SessionStart-snippet chain. `settingsSnippetKeys`
 * reads the `--settings` blob the adapter would hand the CLI and reports which snippets it
 * registers — no spawn, no network. `spawnAndCollect` spawns a real Claude CLI session, collects
 * its stdout, and reads back the on-disk session transcript so a test can assert what Claude Code
 * actually recorded (which SessionStart hook attachments landed, and in what order) instead of
 * asking the spawned model to self-report on its own system prompt — a self-report measured wrong
 * roughly 1 time in 6. Reach for the first for anything a settings blob can answer; the second
 * costs a live, billed model turn and answers only what the CLI's own behaviour can.
 *
 * USAGE:
 * const harness = sessionSpawnHarness();
 * const keys = await harness.settingsSnippetKeys();
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
import { locationsStatics } from '@dungeonmaster/shared/statics';
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

// The one shape a registered snippet takes in .claude/settings.json: the hook binary followed by
// the snippet key, whichever hook event it sits under.
const SNIPPET_COMMAND_PATTERN = /dungeonmaster-session-snippet ([A-Za-z]+)/gu;

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
  settingsSnippetKeys: () => Promise<readonly unknown[]>;
  spawnAndCollect: (params: { prompt: PromptText }) => Promise<{
    assistantText: PromptText;
    exitCode: ExitCode;
    transcript: TranscriptEntry[];
  }>;
} => ({
  // Reads the SAME file childProcessSpawnStreamJsonAdapter reads and passes verbatim as
  // `--settings` (its colocated unit suite pins that pass-through), so the keys returned here are
  // the snippets the spawned CLI is asked to run. Matched by REGEX over the raw text rather than by
  // walking parsed JSON: the shape would need an ad-hoc structural type, which lint refuses, or a
  // cross-package dependency on the hooks package's settings contract. Every registration of a
  // snippet is one `dungeonmaster-session-snippet <key>` command string wherever it sits, so the
  // union of matched keys answers both directions — a key with no command, and a command naming a
  // key that no longer exists.
  settingsSnippetKeys: async (): Promise<readonly unknown[]> => {
    const startPath = FilePathStub({ value: __dirname });
    const repoRoot = await cwdResolveBroker({ startPath, kind: 'repo-root' });
    const settingsPath = absoluteFilePathContract.parse(
      `${String(repoRoot)}/${locationsStatics.repoRoot.claude.dir}/${locationsStatics.repoRoot.claude.settings}`,
    );
    const contents = await readFile(String(settingsPath), 'utf8');
    const matched = [...contents.matchAll(SNIPPET_COMMAND_PATTERN)].map((match) =>
      String(match[1]),
    );
    return [...new Set(matched)].sort();
  },

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
