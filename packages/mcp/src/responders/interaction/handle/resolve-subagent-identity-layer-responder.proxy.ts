import { processCwdAdapterProxy } from '@dungeonmaster/shared/testing';

import { claudeCodeParentSessionFindByToolUseIdBrokerProxy } from '../../../brokers/claude-code-parent-session/find-by-tool-use-id/claude-code-parent-session-find-by-tool-use-id-broker.proxy';

export const ResolveSubagentIdentityLayerResponderProxy = (): {
  setupCwd: (params: { path: string }) => void;
  setupSessionsDir: (params: {
    homedir: string;
    projectDir: string;
    sessionIds: readonly string[];
  }) => void;
  setupSessionsDirMissing: (params: { homedir: string; projectDir: string }) => void;
  setupSubagentsDir: (params: {
    homedir: string;
    projectDir: string;
    sessionId: string;
    agentFilenames: readonly string[];
  }) => void;
  setupAgentFile: (params: {
    homedir: string;
    projectDir: string;
    sessionId: string;
    agentFilename: string;
    contents: string;
  }) => void;
} => {
  const cwdProxy = processCwdAdapterProxy();
  const findProxy = claudeCodeParentSessionFindByToolUseIdBrokerProxy();

  return {
    setupCwd: ({ path }: { path: string }): void => {
      cwdProxy.returns({ path });
    },
    setupSessionsDir: findProxy.setupSessionsDir,
    setupSessionsDirMissing: findProxy.setupSessionsDirMissing,
    setupSubagentsDir: findProxy.setupSubagentsDir,
    setupAgentFile: findProxy.setupAgentFile,
  };
};
