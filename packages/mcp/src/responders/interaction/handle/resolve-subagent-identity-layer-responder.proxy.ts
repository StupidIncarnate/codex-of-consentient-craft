import { processCwdAdapterProxy } from '@dungeonmaster/shared/testing';

import { claudeCodeParentSessionFindByToolUseIdBrokerProxy } from '../../../brokers/claude-code-parent-session/find-by-tool-use-id/claude-code-parent-session-find-by-tool-use-id-broker.proxy';

export const ResolveSubagentIdentityLayerResponderProxy = (): {
  setupCwd: (params: { path: string }) => void;
  setupHomeDir: (params: { path: string }) => void;
  enqueueSessionsDir: (params: { entries: readonly string[] }) => void;
  enqueueSessionsDirMissing: () => void;
  enqueueSubagentsDir: (params: { entries: readonly string[] }) => void;
  enqueueSubagentsDirMissing: () => void;
  enqueueMetaFileContents: (params: { contents: string }) => void;
} => {
  const cwdProxy = processCwdAdapterProxy();
  const findProxy = claudeCodeParentSessionFindByToolUseIdBrokerProxy();

  return {
    setupCwd: ({ path }: { path: string }): void => {
      cwdProxy.returns({ path });
    },
    setupHomeDir: ({ path }: { path: string }): void => {
      findProxy.setupHomeDir({ path });
    },
    enqueueSessionsDir: ({ entries }: { entries: readonly string[] }): void => {
      findProxy.enqueueReaddir({ entries });
    },
    enqueueSessionsDirMissing: (): void => {
      findProxy.enqueueReaddirMissing();
    },
    enqueueSubagentsDir: ({ entries }: { entries: readonly string[] }): void => {
      findProxy.enqueueReaddir({ entries });
    },
    enqueueSubagentsDirMissing: (): void => {
      findProxy.enqueueReaddirMissing();
    },
    enqueueMetaFileContents: ({ contents }: { contents: string }): void => {
      findProxy.enqueueReadFile({ contents });
    },
  };
};
