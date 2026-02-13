import { architectureOverviewBrokerProxy } from '@dungeonmaster/shared/testing';
import {
  architectureFolderDetailBrokerProxy,
  architectureSyntaxRulesBrokerProxy,
  architectureTestingPatternsBrokerProxy,
  mcpDiscoverBrokerProxy,
} from '@dungeonmaster/mcp/testing';
import type {
  AddQuestResult,
  GetQuestResult,
  ModifyQuestResult,
  VerifyQuestResult,
} from '@dungeonmaster/orchestrator';
import type {
  ProcessIdStub,
  OrchestrationStatusStub,
  QuestListItemStub,
  ProjectListItemStub,
  ProjectStub,
  DirectoryEntryStub,
} from '@dungeonmaster/shared/contracts';

import { orchestratorListProjectsAdapterProxy } from '../adapters/orchestrator/list-projects/orchestrator-list-projects-adapter.proxy';
import { orchestratorAddProjectAdapterProxy } from '../adapters/orchestrator/add-project/orchestrator-add-project-adapter.proxy';
import { orchestratorGetProjectAdapterProxy } from '../adapters/orchestrator/get-project/orchestrator-get-project-adapter.proxy';
import { orchestratorUpdateProjectAdapterProxy } from '../adapters/orchestrator/update-project/orchestrator-update-project-adapter.proxy';
import { orchestratorRemoveProjectAdapterProxy } from '../adapters/orchestrator/remove-project/orchestrator-remove-project-adapter.proxy';
import { orchestratorBrowseDirectoriesAdapterProxy } from '../adapters/orchestrator/browse-directories/orchestrator-browse-directories-adapter.proxy';
import { orchestratorListQuestsAdapterProxy } from '../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter.proxy';
import { orchestratorGetQuestAdapterProxy } from '../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.proxy';
import { orchestratorAddQuestAdapterProxy } from '../adapters/orchestrator/add-quest/orchestrator-add-quest-adapter.proxy';
import { orchestratorModifyQuestAdapterProxy } from '../adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter.proxy';
import { orchestratorVerifyQuestAdapterProxy } from '../adapters/orchestrator/verify-quest/orchestrator-verify-quest-adapter.proxy';
import { orchestratorStartQuestAdapterProxy } from '../adapters/orchestrator/start-quest/orchestrator-start-quest-adapter.proxy';
import { orchestratorGetQuestStatusAdapterProxy } from '../adapters/orchestrator/get-quest-status/orchestrator-get-quest-status-adapter.proxy';
import { honoServeAdapterProxy } from '../adapters/hono/serve/hono-serve-adapter.proxy';
import { honoCreateNodeWebSocketAdapterProxy } from '../adapters/hono/create-node-web-socket/hono-create-node-web-socket-adapter.proxy';
import { agentOutputBufferStateProxy } from '../state/agent-output-buffer/agent-output-buffer-state.proxy';
import { wsEventRelayBroadcastBrokerProxy } from '../brokers/ws-event-relay/broadcast/ws-event-relay-broadcast-broker.proxy';
import { StartServer } from './start-server';

type QuestListItem = ReturnType<typeof QuestListItemStub>;
type ProcessId = ReturnType<typeof ProcessIdStub>;
type OrchestrationStatus = ReturnType<typeof OrchestrationStatusStub>;
type ProjectListItem = ReturnType<typeof ProjectListItemStub>;
type Project = ReturnType<typeof ProjectStub>;
type DirectoryEntry = ReturnType<typeof DirectoryEntryStub>;

export const StartServerProxy = (): {
  request: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  setupListProjects: (params: { projects: ProjectListItem[] }) => void;
  setupListProjectsError: (params: { error: Error }) => void;
  setupAddProject: (params: { project: Project }) => void;
  setupAddProjectError: (params: { error: Error }) => void;
  setupGetProject: (params: { project: Project }) => void;
  setupGetProjectError: (params: { error: Error }) => void;
  setupUpdateProject: (params: { project: Project }) => void;
  setupUpdateProjectError: (params: { error: Error }) => void;
  setupRemoveProjectError: (params: { error: Error }) => void;
  setupBrowseDirectories: (params: { entries: DirectoryEntry[] }) => void;
  setupBrowseDirectoriesError: (params: { error: Error }) => void;
  setupListQuests: (params: { quests: QuestListItem[] }) => void;
  setupListQuestsError: (params: { error: Error }) => void;
  setupGetQuest: (params: { result: GetQuestResult }) => void;
  setupGetQuestError: (params: { error: Error }) => void;
  setupAddQuest: (params: { result: AddQuestResult }) => void;
  setupAddQuestError: (params: { error: Error }) => void;
  setupModifyQuest: (params: { result: ModifyQuestResult }) => void;
  setupModifyQuestError: (params: { error: Error }) => void;
  setupVerifyQuest: (params: { result: VerifyQuestResult }) => void;
  setupVerifyQuestError: (params: { error: Error }) => void;
  setupStartQuest: (params: { processId: ProcessId }) => void;
  setupStartQuestError: (params: { error: Error }) => void;
  setupGetQuestStatus: (params: { status: OrchestrationStatus }) => void;
  setupGetQuestStatusError: (params: { error: Error }) => void;
} => {
  const serveProxy = honoServeAdapterProxy();
  honoCreateNodeWebSocketAdapterProxy();
  architectureOverviewBrokerProxy();
  architectureFolderDetailBrokerProxy();
  architectureSyntaxRulesBrokerProxy();
  architectureTestingPatternsBrokerProxy();
  mcpDiscoverBrokerProxy();
  agentOutputBufferStateProxy();
  wsEventRelayBroadcastBrokerProxy();

  const listProjectsProxy = orchestratorListProjectsAdapterProxy();
  const addProjectProxy = orchestratorAddProjectAdapterProxy();
  const getProjectProxy = orchestratorGetProjectAdapterProxy();
  const updateProjectProxy = orchestratorUpdateProjectAdapterProxy();
  const removeProjectProxy = orchestratorRemoveProjectAdapterProxy();
  const browseDirectoriesProxy = orchestratorBrowseDirectoriesAdapterProxy();
  const listQuestsProxy = orchestratorListQuestsAdapterProxy();
  const getQuestProxy = orchestratorGetQuestAdapterProxy();
  const addQuestProxy = orchestratorAddQuestAdapterProxy();
  const modifyQuestProxy = orchestratorModifyQuestAdapterProxy();
  const verifyQuestProxy = orchestratorVerifyQuestAdapterProxy();
  const startQuestProxy = orchestratorStartQuestAdapterProxy();
  const getQuestStatusProxy = orchestratorGetQuestStatusAdapterProxy();

  StartServer();

  const fetch = serveProxy.getCapturedFetch();

  return {
    request: async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? `http://localhost${input}` : input;
      const request = new Request(url, init);
      return fetch(request);
    },
    setupListProjects: ({ projects }: { projects: ProjectListItem[] }): void => {
      listProjectsProxy.returns({ projects });
    },
    setupListProjectsError: ({ error }: { error: Error }): void => {
      listProjectsProxy.throws({ error });
    },
    setupAddProject: ({ project }: { project: Project }): void => {
      addProjectProxy.returns({ project });
    },
    setupAddProjectError: ({ error }: { error: Error }): void => {
      addProjectProxy.throws({ error });
    },
    setupGetProject: ({ project }: { project: Project }): void => {
      getProjectProxy.returns({ project });
    },
    setupGetProjectError: ({ error }: { error: Error }): void => {
      getProjectProxy.throws({ error });
    },
    setupUpdateProject: ({ project }: { project: Project }): void => {
      updateProjectProxy.returns({ project });
    },
    setupUpdateProjectError: ({ error }: { error: Error }): void => {
      updateProjectProxy.throws({ error });
    },
    setupRemoveProjectError: ({ error }: { error: Error }): void => {
      removeProjectProxy.throws({ error });
    },
    setupBrowseDirectories: ({ entries }: { entries: DirectoryEntry[] }): void => {
      browseDirectoriesProxy.returns({ entries });
    },
    setupBrowseDirectoriesError: ({ error }: { error: Error }): void => {
      browseDirectoriesProxy.throws({ error });
    },
    setupListQuests: ({ quests }: { quests: QuestListItem[] }): void => {
      listQuestsProxy.returns({ quests });
    },
    setupListQuestsError: ({ error }: { error: Error }): void => {
      listQuestsProxy.throws({ error });
    },
    setupGetQuest: ({ result }: { result: GetQuestResult }): void => {
      getQuestProxy.returns({ result });
    },
    setupGetQuestError: ({ error }: { error: Error }): void => {
      getQuestProxy.throws({ error });
    },
    setupAddQuest: ({ result }: { result: AddQuestResult }): void => {
      addQuestProxy.returns({ result });
    },
    setupAddQuestError: ({ error }: { error: Error }): void => {
      addQuestProxy.throws({ error });
    },
    setupModifyQuest: ({ result }: { result: ModifyQuestResult }): void => {
      modifyQuestProxy.returns({ result });
    },
    setupModifyQuestError: ({ error }: { error: Error }): void => {
      modifyQuestProxy.throws({ error });
    },
    setupVerifyQuest: ({ result }: { result: VerifyQuestResult }): void => {
      verifyQuestProxy.returns({ result });
    },
    setupVerifyQuestError: ({ error }: { error: Error }): void => {
      verifyQuestProxy.throws({ error });
    },
    setupStartQuest: ({ processId }: { processId: ProcessId }): void => {
      startQuestProxy.returns({ processId });
    },
    setupStartQuestError: ({ error }: { error: Error }): void => {
      startQuestProxy.throws({ error });
    },
    setupGetQuestStatus: ({ status }: { status: OrchestrationStatus }): void => {
      getQuestStatusProxy.returns({ status });
    },
    setupGetQuestStatusError: ({ error }: { error: Error }): void => {
      getQuestStatusProxy.throws({ error });
    },
  };
};
