import { FilePathStub, SessionIdStub } from '@dungeonmaster/shared/contracts';
import { processCwdAdapterProxy } from '@dungeonmaster/shared/testing';

import { claudeCodeSessionResolveBrokerProxy } from '../../../brokers/claude-code-session/resolve/claude-code-session-resolve-broker.proxy';
import { claudeCodeSubagentFindByToolUseIdBrokerProxy } from '../../../brokers/claude-code-subagent/find-by-tool-use-id/claude-code-subagent-find-by-tool-use-id-broker.proxy';
import { claudeCodeSubagentFindByWorkItemIdBrokerProxy } from '../../../brokers/claude-code-subagent/find-by-work-item-id/claude-code-subagent-find-by-work-item-id-broker.proxy';
import { orchestratorGetMonitorSessionAdapterProxy } from '../../../adapters/orchestrator/get-monitor-session/orchestrator-get-monitor-session-adapter.proxy';

export const ResolveSubagentIdentityLayerResponderProxy = (): {
  setupParentSession: (params: {
    homedir: string;
    cwd: string;
    sessionEntries: readonly { name: string; mtimeMs: number }[];
  }) => void;
  setupSubagentMatch: (params: {
    files: readonly string[];
    matchFilename: string;
    matchFirstLine: string;
  }) => void;
  setupSubagentDirMissing: () => void;
  setupRegisteredMonitorSession: (params: { sessionId: string; projectDir: string }) => void;
  setupToolUseIdMatch: (params: {
    files: readonly string[];
    matchFilename: string;
    matchMetaContents: string;
  }) => void;
} => {
  const cwdProxy = processCwdAdapterProxy();
  const sessionProxy = claudeCodeSessionResolveBrokerProxy();
  const subagentProxy = claudeCodeSubagentFindByWorkItemIdBrokerProxy();
  const toolUseIdProxy = claudeCodeSubagentFindByToolUseIdBrokerProxy();
  const monitorSessionProxy = orchestratorGetMonitorSessionAdapterProxy();

  return {
    setupParentSession: ({
      homedir,
      cwd,
      sessionEntries,
    }: {
      homedir: string;
      cwd: string;
      sessionEntries: readonly { name: string; mtimeMs: number }[];
    }): void => {
      cwdProxy.returns({ path: cwd });
      sessionProxy.setupHomedir({ homedir });
      sessionProxy.setupSessionsDir({ entries: sessionEntries });
      subagentProxy.setupHomeDir({ path: homedir });
    },
    setupSubagentMatch: ({
      files,
      matchFilename,
      matchFirstLine,
    }: {
      files: readonly string[];
      matchFilename: string;
      matchFirstLine: string;
    }): void => {
      subagentProxy.setupSubagentDirFiles({ files });
      subagentProxy.setupFileContents({ filename: matchFilename, firstLine: matchFirstLine });
    },
    setupSubagentDirMissing: (): void => {
      subagentProxy.setupSubagentDirMissing();
    },
    setupRegisteredMonitorSession: ({
      sessionId,
      projectDir,
    }: {
      sessionId: string;
      projectDir: string;
    }): void => {
      monitorSessionProxy.returns({
        session: {
          sessionId: SessionIdStub({ value: sessionId }),
          projectDir: FilePathStub({ value: projectDir }),
        },
      });
    },
    setupToolUseIdMatch: ({
      files,
      matchFilename,
      matchMetaContents,
    }: {
      files: readonly string[];
      matchFilename: string;
      matchMetaContents: string;
    }): void => {
      toolUseIdProxy.setupSubagentDirFiles({ files });
      toolUseIdProxy.setupMetaFileContents({
        filename: matchFilename,
        contents: matchMetaContents,
      });
    },
  };
};
