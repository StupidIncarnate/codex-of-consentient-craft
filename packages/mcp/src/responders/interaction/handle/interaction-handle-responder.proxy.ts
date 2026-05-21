/**
 * PURPOSE: Test setup helper for interaction handle responder
 *
 * USAGE:
 * const proxy = InteractionHandleResponderProxy();
 * const result = proxy.callResponder({ tool: ToolNameStub({ value: 'signal-back' }), args: { signal: 'complete' } });
 */

import { processCwdAdapterProxy } from '@dungeonmaster/shared/testing';

import { signalBackBrokerProxy } from '../../../brokers/signal/back/signal-back-broker.proxy';
import { claudeCodeSessionResolveBrokerProxy } from '../../../brokers/claude-code-session/resolve/claude-code-session-resolve-broker.proxy';
import { claudeCodeSubagentFindByWorkItemIdBrokerProxy } from '../../../brokers/claude-code-subagent/find-by-work-item-id/claude-code-subagent-find-by-work-item-id-broker.proxy';
import { orchestratorGetAgentPromptAdapterProxy } from '../../../adapters/orchestrator/get-agent-prompt/orchestrator-get-agent-prompt-adapter.proxy';
import { orchestratorHandleSignalBackAdapterProxy } from '../../../adapters/orchestrator/handle-signal-back/orchestrator-handle-signal-back-adapter.proxy';
import { orchestratorModifyQuestAdapterProxy } from '../../../adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter.proxy';
import type { AgentPromptResult } from '@dungeonmaster/shared/contracts';
import { InteractionHandleResponder } from './interaction-handle-responder';

export const InteractionHandleResponderProxy = (): {
  callResponder: typeof InteractionHandleResponder;
  setupAgentPromptReturns: (params: { result: AgentPromptResult }) => void;
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
  getLastModifyQuestInput: () => unknown;
} => {
  signalBackBrokerProxy();
  const cwdProxy = processCwdAdapterProxy();
  const sessionProxy = claudeCodeSessionResolveBrokerProxy();
  const subagentProxy = claudeCodeSubagentFindByWorkItemIdBrokerProxy();
  const agentPromptProxy = orchestratorGetAgentPromptAdapterProxy();
  orchestratorHandleSignalBackAdapterProxy();
  const modifyProxy = orchestratorModifyQuestAdapterProxy();
  // Tests that don't opt into `setupParentSession` get the underlying fs mock's
  // default empty-array readdir response — that resolves the parent session to
  // `undefined`, which short-circuits the stamp path in the responder.

  return {
    callResponder: InteractionHandleResponder,
    setupAgentPromptReturns: ({ result }: { result: AgentPromptResult }): void => {
      agentPromptProxy.returns({ result });
    },
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
      // Subagent-find broker also resolves the homedir; share the same mock.
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
    getLastModifyQuestInput: (): unknown => modifyProxy.getLastCalledInput(),
  };
};
