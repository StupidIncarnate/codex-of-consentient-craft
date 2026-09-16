/**
 * PURPOSE: Test setup helper for callerRepoRootResolveBroker — stages the server's own cwd, the
 * cached-cursor warm scan, the cold JSONL scan (hit or miss), and the repo-root walk-up
 * cwdResolveBroker performs on whichever starting path the broker picked.
 *
 * USAGE:
 * const proxy = callerRepoRootResolveBrokerProxy();
 * proxy.setupServerCwd({ cwd: '/repo' });
 * proxy.setupCachedEntryMatch({ filepath: '/a.jsonl', contents: LINE_WITH_MATCH });
 * proxy.setupRepoRootAtStart({ startPath: '/repo' });
 */

import { processCwdAdapterProxy, cwdResolveBrokerProxy } from '@dungeonmaster/shared/testing';

import { claudeCodeCallerCwdFindByToolUseIdBrokerProxy } from '../../claude-code-caller-cwd/find-by-tool-use-id/claude-code-caller-cwd-find-by-tool-use-id-broker.proxy';
import { claudeCodeCallerCwdScanCachedEntriesBrokerProxy } from '../../claude-code-caller-cwd/scan-cached-entries/claude-code-caller-cwd-scan-cached-entries-broker.proxy';

export const callerRepoRootResolveBrokerProxy = (): {
  setupServerCwd: (params: { cwd: string }) => void;
  setupCachedEntryFile: (params: { filepath: string; contents: string }) => void;
  setupColdMatch: (params: {
    serverCwd: string;
    homedir: string;
    sessionId: string;
    toolUseId: string;
    callerCwd: string;
  }) => void;
  setupColdNoMatch: (params: { serverCwd: string; homedir: string }) => void;
  setupRepoRootAtStart: (params: { startPath: string }) => void;
  setupRepoRootInParent: (params: { startPath: string; repoRoot: string }) => void;
  setupRepoRootNotFound: (params: { startPath: string }) => void;
} => {
  const processCwdProxy = processCwdAdapterProxy();
  const cachedEntriesProxy = claudeCodeCallerCwdScanCachedEntriesBrokerProxy();
  const coldScanProxy = claudeCodeCallerCwdFindByToolUseIdBrokerProxy();
  const cwdResolveProxy = cwdResolveBrokerProxy();

  return {
    setupServerCwd: ({ cwd }: { cwd: string }): void => {
      processCwdProxy.returns({ path: cwd });
    },
    setupCachedEntryFile: ({
      filepath,
      contents,
    }: {
      filepath: string;
      contents: string;
    }): void => {
      cachedEntriesProxy.setupFile({ filepath, contents });
    },
    setupColdMatch: ({
      serverCwd,
      homedir,
      sessionId,
      toolUseId,
      callerCwd,
    }: {
      serverCwd: string;
      homedir: string;
      sessionId: string;
      toolUseId: string;
      callerCwd: string;
    }): void => {
      coldScanProxy.setupTopLevelSessions({
        homedir,
        projectDir: serverCwd,
        sessions: [
          {
            sessionId,
            mtimeMs: 1,
            contents: JSON.stringify({
              type: 'assistant',
              cwd: callerCwd,
              message: {
                role: 'assistant',
                content: [
                  {
                    type: 'tool_use',
                    id: toolUseId,
                    name: 'mcp__dungeonmaster__get-project-inventory',
                  },
                ],
              },
            }),
          },
        ],
      });
    },
    setupColdNoMatch: ({ serverCwd, homedir }: { serverCwd: string; homedir: string }): void => {
      coldScanProxy.setupSessionsDirMissing({ homedir, projectDir: serverCwd });
    },
    setupRepoRootAtStart: ({ startPath }: { startPath: string }): void => {
      cwdResolveProxy.setupRepoRootFoundAtStart({ startPath });
    },
    setupRepoRootInParent: ({
      startPath,
      repoRoot,
    }: {
      startPath: string;
      repoRoot: string;
    }): void => {
      cwdResolveProxy.setupRepoRootFoundInParent({ startPath, repoRoot });
    },
    setupRepoRootNotFound: ({ startPath }: { startPath: string }): void => {
      cwdResolveProxy.setupRepoRootNotFound({ startPath });
    },
  };
};
