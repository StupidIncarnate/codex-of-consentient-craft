/**
 * PURPOSE: Harness for spawning a real Claude CLI session and collecting its output for integration testing
 *
 * USAGE:
 * const harness = sessionSpawnHarness();
 * const { assistantText, exitCode, hooksFired } = await harness.spawnAndCollect({ prompt, cwd });
 */

import { createInterface } from 'readline';
import { ExitCodeStub, FilePathStub } from '@dungeonmaster/shared/contracts';
import { configRootFindBroker } from '@dungeonmaster/shared/brokers';
import { PromptTextStub } from '../../../src/contracts/prompt-text/prompt-text.stub';
import { childProcessSpawnStreamJsonAdapter } from '../../../src/adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter';

type ExitCode = ReturnType<typeof ExitCodeStub>;
type PromptText = ReturnType<typeof PromptTextStub>;

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

const detectHooksFired = ({ lines }: { lines: PromptText[] }): boolean => {
  for (const line of lines) {
    try {
      const raw = String(line);
      if (raw.includes('SessionStart') && raw.includes('hook')) {
        return true;
      }
    } catch {
      // skip
    }
  }
  return false;
};

export const sessionSpawnHarness = (): {
  spawnAndCollect: (params: { prompt: PromptText }) => Promise<{
    assistantText: PromptText;
    exitCode: ExitCode;
    hooksFired: boolean;
  }>;
} => ({
  spawnAndCollect: async ({
    prompt,
  }: {
    prompt: PromptText;
  }): Promise<{
    assistantText: PromptText;
    exitCode: ExitCode;
    hooksFired: boolean;
  }> =>
    new Promise((resolve, reject) => {
      const startPath = FilePathStub({ value: __dirname });
      configRootFindBroker({ startPath })
        .then((repoRoot) => {
          const { process: child, stdout } = childProcessSpawnStreamJsonAdapter({
            prompt,
            cwd: String(repoRoot),
            stdinMode: 'ignore',
          });

          const collected: PromptText[] = [];
          const rl = createInterface({ input: stdout });
          rl.on('line', (line) => collected.push(PromptTextStub({ value: line })));

          child.on('exit', (code) => {
            rl.close();
            resolve({
              assistantText: extractAssistantText({ lines: collected }),
              exitCode: ExitCodeStub({ value: code ?? 0 }),
              hooksFired: detectHooksFired({ lines: collected }),
            });
          });

          child.on('error', (err) => {
            rl.close();
            reject(err);
          });
        })
        .catch(reject);
    }),
});
