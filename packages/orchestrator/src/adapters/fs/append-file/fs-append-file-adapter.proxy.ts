import { appendFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsAppendFileAdapterProxy = (): {
  succeeds: (params: { filePath: FilePath }) => void;
  throws: (params: { filePath: FilePath; error: Error }) => void;
  getAppendedFor: (params: { filePath: FilePath }) => unknown;
  getAllAppendedFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  const mock: MockHandle = registerMock({ fn: appendFile });

  // Default: any unaddressed call succeeds. Kept (not removed) because
  // chat-subagent-tail-broker.proxy.ts composes this adapter proxy bare, with no per-call
  // staging — it touches a dynamically-computed subagent JSONL path (built from
  // sessionId+agentId+guildPath inside the real broker) purely to ensure the file exists,
  // and has no way to predict that path ahead of time to address a `.succeeds()` call.
  // Mirrors the same courtesy default fsMkdirAdapterProxy (`@dungeonmaster/shared`) keeps
  // for the sibling mkdir call in that same broker.
  mock.calledWith([]).resolves({ success: true as const });

  return {
    succeeds: ({ filePath }: { filePath: FilePath }): void => {
      mock.calledWith([filePath]).resolves({ success: true as const });
    },

    throws: ({ filePath, error }: { filePath: FilePath; error: Error }): void => {
      mock.calledWith([filePath]).rejects(error);
    },

    getAppendedFor: ({ filePath }: { filePath: FilePath }): unknown =>
      mock.callsMatching([filePath]).at(-1)?.[1],

    getAllAppendedFiles: (): readonly { path: unknown; content: unknown }[] =>
      mock.callsMatching([]).map((call) => ({
        path: call[0],
        content: call[1],
      })),
  };
};
