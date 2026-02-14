import { screen } from '@testing-library/react';

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
import { GuildListWidgetProxy } from '../guild-list/guild-list-widget.proxy';
import { GuildQuestListWidgetProxy } from '../guild-quest-list/guild-quest-list-widget.proxy';
import { LogoWidgetProxy } from '../logo/logo-widget.proxy';
import { MapFrameWidgetProxy } from '../map-frame/map-frame-widget.proxy';
import { ProjectAddModalWidgetProxy } from '../project-add-modal/project-add-modal-widget.proxy';
import { ProjectEmptyStateWidgetProxy } from '../project-empty-state/project-empty-state-widget.proxy';
import { QuestDetailWidgetProxy } from '../quest-detail/quest-detail-widget.proxy';

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
  setupDirectoryBrowse: (params: Parameters<typeof emptyState.setupDirectoryBrowse>[0]) => void;
  setupQuests: (params: { quests: QuestListItem[] }) => void;
  setupQuestsError: () => void;
  setupQuestDetail: (params: { quest: Quest }) => void;
  setupQuestDetailError: () => void;
  setupExecutionStart: (params: { processId: ProcessId }) => void;
  setupExecutionStartError: () => void;
  setupExecutionStatus: (params: { status: OrchestrationStatus }) => void;
  setupExecutionStatusError: () => void;
  clickGuildItem: (params: { testId: string }) => Promise<void>;
  isGuildItemVisible: (params: { testId: string }) => boolean;
  isGuildItemSelected: (params: { testId: string }) => boolean;
  clickAddGuild: () => Promise<void>;
  isNewGuildTitleVisible: () => boolean;
  isQuestEmptyStateVisible: () => boolean;
  isSelectGuildMessageVisible: () => boolean;
  getQuestStatusText: (params: { testId: string }) => HTMLElement['textContent'];
  typeGuildName: (params: { value: string }) => Promise<void>;
  typeGuildPath: (params: { value: string }) => Promise<void>;
  getGuildPathValue: () => HTMLElement['textContent'];
  clickBrowseGuild: () => Promise<void>;
  clickCreateGuild: () => Promise<void>;
  clickCancelGuild: () => Promise<void>;
  clickDirectorySelect: () => Promise<void>;
  clickQuestItem: (params: { testId: string }) => Promise<void>;
  isQuestVisible: (params: { testId: string }) => boolean;
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
  LogoWidgetProxy();
  MapFrameWidgetProxy();
  const guildList = GuildListWidgetProxy();
  const questList = GuildQuestListWidgetProxy();
  const emptyState = ProjectEmptyStateWidgetProxy();
  const addModal = ProjectAddModalWidgetProxy();
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
    setupDirectoryBrowse: (params: Parameters<typeof emptyState.setupDirectoryBrowse>[0]): void => {
      emptyState.setupDirectoryBrowse(params);
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
    clickGuildItem: async ({ testId }: { testId: string }): Promise<void> => {
      await guildList.clickItem({ testId });
    },
    isGuildItemVisible: ({ testId }: { testId: string }): boolean =>
      guildList.isItemVisible({ testId }),
    isGuildItemSelected: ({ testId }: { testId: string }): boolean =>
      guildList.isItemSelected({ testId }),
    clickAddGuild: async (): Promise<void> => {
      await guildList.clickAddButton();
    },
    isNewGuildTitleVisible: (): boolean => emptyState.isNewGuildTitleVisible(),
    isQuestEmptyStateVisible: (): boolean => questList.hasEmptyState(),
    isSelectGuildMessageVisible: (): boolean => screen.queryByText('Select a guild') !== null,
    getQuestStatusText: ({ testId }: { testId: string }): HTMLElement['textContent'] => {
      const element = screen.queryByTestId(testId);
      return element?.textContent ?? null;
    },
    typeGuildName: async ({ value }: { value: string }): Promise<void> => {
      await emptyState.typeGuildName({ value });
    },
    typeGuildPath: async ({ value }: { value: string }): Promise<void> => {
      await emptyState.typeGuildPath({ value });
    },
    getGuildPathValue: (): HTMLElement['textContent'] => emptyState.getGuildPathValue(),
    clickBrowseGuild: async (): Promise<void> => {
      await emptyState.clickBrowse();
    },
    clickCreateGuild: async (): Promise<void> => {
      await emptyState.clickCreate();
    },
    clickCancelGuild: async (): Promise<void> => {
      await emptyState.clickCancel();
    },
    clickDirectorySelect: async (): Promise<void> => {
      await emptyState.clickDirectorySelect();
    },
    clickQuestItem: async ({ testId }: { testId: string }): Promise<void> => {
      await questList.clickQuest({ testId });
    },
    isQuestVisible: ({ testId }: { testId: string }): boolean =>
      questList.isQuestVisible({ testId }),
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
