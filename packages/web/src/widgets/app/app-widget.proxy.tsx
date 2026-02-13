import type {
  OrchestrationStatusStub,
  ProcessIdStub,
  ProjectIdStub,
  ProjectListItemStub,
  QuestListItemStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { useAgentOutputBindingProxy } from '../../bindings/use-agent-output/use-agent-output-binding.proxy';
import { useExecutionBindingProxy } from '../../bindings/use-execution/use-execution-binding.proxy';
import { useProjectsBindingProxy } from '../../bindings/use-projects/use-projects-binding.proxy';
import { useQuestDetailBindingProxy } from '../../bindings/use-quest-detail/use-quest-detail-binding.proxy';
import { useQuestsBindingProxy } from '../../bindings/use-quests/use-quests-binding.proxy';
import { projectCreateBrokerProxy } from '../../brokers/project/create/project-create-broker.proxy';
import { ProjectAddModalWidgetProxy } from '../project-add-modal/project-add-modal-widget.proxy';
import { ProjectEmptyStateWidgetProxy } from '../project-empty-state/project-empty-state-widget.proxy';
import { ProjectSidebarWidgetProxy } from '../project-sidebar/project-sidebar-widget.proxy';
import { QuestDetailWidgetProxy } from '../quest-detail/quest-detail-widget.proxy';
import { QuestListWidgetProxy } from '../quest-list/quest-list-widget.proxy';

type QuestListItem = ReturnType<typeof QuestListItemStub>;
type Quest = ReturnType<typeof QuestStub>;
type ProcessId = ReturnType<typeof ProcessIdStub>;
type OrchestrationStatus = ReturnType<typeof OrchestrationStatusStub>;
type ProjectListItem = ReturnType<typeof ProjectListItemStub>;
type ProjectId = ReturnType<typeof ProjectIdStub>;

export const AppWidgetProxy = (): {
  setupProjects: (params: { projects: ProjectListItem[] }) => void;
  setupProjectsError: () => void;
  setupCreateProject: (params: { id: ProjectId }) => void;
  setupQuests: (params: { quests: QuestListItem[] }) => void;
  setupQuestsError: () => void;
  setupQuestDetail: (params: { quest: Quest }) => void;
  setupQuestDetailError: () => void;
  setupExecutionStart: (params: { processId: ProcessId }) => void;
  setupExecutionStartError: () => void;
  setupExecutionStatus: (params: { status: OrchestrationStatus }) => void;
  setupExecutionStatusError: () => void;
  clickAddProject: () => Promise<void>;
  clickProject: (params: { name: string }) => Promise<void>;
  isProjectVisible: (params: { name: string }) => boolean;
  clickCreateFirstProject: () => Promise<void>;
  isWelcomeVisible: () => boolean;
  typeProjectName: (params: { name: string }) => Promise<void>;
  clickBrowse: () => Promise<void>;
  clickCreateProjectSubmit: () => Promise<void>;
  clickCancelModal: () => Promise<void>;
  isCreateProjectDisabled: () => boolean;
  getPathDisplay: () => HTMLElement['textContent'];
} => {
  const questDetailProxy = useQuestDetailBindingProxy();
  const executionProxy = useExecutionBindingProxy();
  useAgentOutputBindingProxy();
  const questsProxy = useQuestsBindingProxy();
  const projectsProxy = useProjectsBindingProxy();
  const createProjectProxy = projectCreateBrokerProxy();
  const sidebar = ProjectSidebarWidgetProxy();
  const emptyState = ProjectEmptyStateWidgetProxy();
  const addModal = ProjectAddModalWidgetProxy();
  QuestListWidgetProxy();
  QuestDetailWidgetProxy();

  return {
    setupProjects: ({ projects }: { projects: ProjectListItem[] }): void => {
      projectsProxy.setupProjects({ projects });
    },
    setupProjectsError: (): void => {
      projectsProxy.setupError();
    },
    setupCreateProject: ({ id }: { id: ProjectId }): void => {
      createProjectProxy.setupCreate({ id });
    },
    setupQuests: ({ quests }: { quests: QuestListItem[] }): void => {
      questsProxy.setupQuests({ quests });
    },
    setupQuestsError: (): void => {
      questsProxy.setupError();
    },
    setupQuestDetail: ({ quest }: { quest: Quest }): void => {
      questDetailProxy.setupQuest({ quest });
    },
    setupQuestDetailError: (): void => {
      questDetailProxy.setupError();
    },
    setupExecutionStart: ({ processId }: { processId: ProcessId }): void => {
      executionProxy.setupStart({ processId });
    },
    setupExecutionStartError: (): void => {
      executionProxy.setupStartError();
    },
    setupExecutionStatus: ({ status }: { status: OrchestrationStatus }): void => {
      executionProxy.setupStatus({ status });
    },
    setupExecutionStatusError: (): void => {
      executionProxy.setupStatusError();
    },
    clickAddProject: async (): Promise<void> => {
      await sidebar.clickAddProject();
    },
    clickProject: async ({ name }: { name: string }): Promise<void> => {
      await sidebar.clickProject({ name });
    },
    isProjectVisible: ({ name }: { name: string }): boolean => sidebar.isProjectVisible({ name }),
    clickCreateFirstProject: async (): Promise<void> => {
      await emptyState.clickCreateFirstProject();
    },
    isWelcomeVisible: (): boolean => emptyState.isWelcomeVisible(),
    typeProjectName: async ({ name }: { name: string }): Promise<void> => {
      await addModal.typeName({ name });
    },
    clickBrowse: async (): Promise<void> => {
      await addModal.clickBrowse();
    },
    clickCreateProjectSubmit: async (): Promise<void> => {
      await addModal.clickCreate();
    },
    clickCancelModal: async (): Promise<void> => {
      await addModal.clickCancel();
    },
    isCreateProjectDisabled: (): boolean => addModal.isCreateDisabled(),
    getPathDisplay: (): HTMLElement['textContent'] => addModal.getPathDisplay(),
  };
};
