import type { QuestStub } from '@dungeonmaster/shared/contracts';
import {
  ExitCodeStub,
  FilePathStub,
  QuestIdStub,
  UserInputStub,
} from '@dungeonmaster/shared/contracts';

import { SlotCountStub } from '../../../contracts/slot-count/slot-count.stub';
import { SlotOperationsStub } from '../../../contracts/slot-operations/slot-operations.stub';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';
import { agentOrchestrateBroker } from './agent-orchestrate-broker';
import { agentOrchestrateBrokerProxy } from './agent-orchestrate-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;
type QuestId = ReturnType<typeof QuestIdStub>;

describe('agentOrchestrateBroker', () => {
  describe('successful pipeline', () => {
    it('VALID: ChaosWhisperer succeeds, quest ready, PathSeeker succeeds => runs SlotManager', async () => {
      const proxy = agentOrchestrateBrokerProxy();
      const chaoswhispererExitCode = ExitCodeStub({ value: 0 });
      const pathseekerExitCode = ExitCodeStub({ value: 0 });

      proxy.setupChaoswhispererSuccess({ exitCode: chaoswhispererExitCode });
      proxy.setupPathseekerSuccess({ exitCode: pathseekerExitCode });
      proxy.setupSlotManagerSuccess();

      const quest = proxy.createQuestReady();
      const getQuest = jest.fn().mockResolvedValue({ quest });

      const userInput = UserInputStub({ value: 'I need user authentication' });
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: '/quests/add-auth/quest.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();

      const result = await agentOrchestrateBroker({
        userInput,
        questId,
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        getQuest,
      });

      expect(result).toStrictEqual({
        chaoswhispererExitCode,
        pathseekerExitCode,
        pathseekerSkipped: false,
        slotManagerResult: { completed: true },
        slotManagerSkipped: false,
      });
    });

    it('VALID: ChaosWhisperer succeeds, quest NOT ready => skips PathSeeker and SlotManager', async () => {
      const proxy = agentOrchestrateBrokerProxy();
      const chaoswhispererExitCode = ExitCodeStub({ value: 0 });

      proxy.setupChaoswhispererSuccess({ exitCode: chaoswhispererExitCode });

      const quest = proxy.createQuestNotReady();
      const getQuest = jest.fn().mockResolvedValue({ quest });

      const userInput = UserInputStub({ value: 'I need user authentication' });
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: '/quests/add-auth/quest.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();

      const result = await agentOrchestrateBroker({
        userInput,
        questId,
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        getQuest,
      });

      expect(result).toStrictEqual({
        chaoswhispererExitCode,
        pathseekerExitCode: null,
        pathseekerSkipped: true,
        slotManagerResult: null,
        slotManagerSkipped: true,
      });
    });

    it('VALID: PathSeeker exits with code 0 => runs SlotManager', async () => {
      const proxy = agentOrchestrateBrokerProxy();
      const chaoswhispererExitCode = ExitCodeStub({ value: 0 });
      const pathseekerExitCode = ExitCodeStub({ value: 0 });

      proxy.setupChaoswhispererSuccess({ exitCode: chaoswhispererExitCode });
      proxy.setupPathseekerSuccess({ exitCode: pathseekerExitCode });
      proxy.setupSlotManagerSuccess();

      const quest = proxy.createQuestReady();
      const getQuest = jest.fn().mockResolvedValue({ quest });

      const userInput = UserInputStub({ value: 'Add dark mode toggle' });
      const questId = QuestIdStub({ value: 'dark-mode' });
      const questFilePath = FilePathStub({ value: '/quests/dark-mode/quest.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();

      const result = await agentOrchestrateBroker({
        userInput,
        questId,
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        getQuest,
      });

      expect(result).toStrictEqual({
        chaoswhispererExitCode,
        pathseekerExitCode,
        pathseekerSkipped: false,
        slotManagerResult: { completed: true },
        slotManagerSkipped: false,
      });
    });

    it('VALID: PathSeeker exits with code 1 => skips SlotManager', async () => {
      const proxy = agentOrchestrateBrokerProxy();
      const chaoswhispererExitCode = ExitCodeStub({ value: 0 });
      const pathseekerExitCode = ExitCodeStub({ value: 1 });

      proxy.setupChaoswhispererSuccess({ exitCode: chaoswhispererExitCode });
      proxy.setupPathseekerSuccess({ exitCode: pathseekerExitCode });

      const quest = proxy.createQuestReady();
      const getQuest = jest.fn().mockResolvedValue({ quest });

      const userInput = UserInputStub({ value: 'I need user authentication' });
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: '/quests/add-auth/quest.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();

      const result = await agentOrchestrateBroker({
        userInput,
        questId,
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        getQuest,
      });

      expect(result).toStrictEqual({
        chaoswhispererExitCode,
        pathseekerExitCode,
        pathseekerSkipped: false,
        slotManagerResult: null,
        slotManagerSkipped: true,
      });
    });
  });

  describe('ChaosWhisperer non-zero exit', () => {
    it('VALID: ChaosWhisperer exits with code 1 => skips PathSeeker and SlotManager', async () => {
      const proxy = agentOrchestrateBrokerProxy();
      const chaoswhispererExitCode = ExitCodeStub({ value: 1 });

      proxy.setupChaoswhispererSuccess({ exitCode: chaoswhispererExitCode });

      const getQuest = jest.fn<Promise<{ quest: Quest }>, [{ questId: QuestId }]>();

      const userInput = UserInputStub({ value: 'I need user authentication' });
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: '/quests/add-auth/quest.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();

      const result = await agentOrchestrateBroker({
        userInput,
        questId,
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        getQuest,
      });

      expect(result).toStrictEqual({
        chaoswhispererExitCode,
        pathseekerExitCode: null,
        pathseekerSkipped: true,
        slotManagerResult: null,
        slotManagerSkipped: true,
      });
      expect(getQuest).not.toHaveBeenCalled();
    });

    it('VALID: ChaosWhisperer exits with code 130 (SIGINT) => skips PathSeeker and SlotManager', async () => {
      const proxy = agentOrchestrateBrokerProxy();
      const chaoswhispererExitCode = ExitCodeStub({ value: 130 });

      proxy.setupChaoswhispererSuccess({ exitCode: chaoswhispererExitCode });

      const getQuest = jest.fn<Promise<{ quest: Quest }>, [{ questId: QuestId }]>();

      const userInput = UserInputStub({ value: 'I need user authentication' });
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: '/quests/add-auth/quest.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();

      const result = await agentOrchestrateBroker({
        userInput,
        questId,
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        getQuest,
      });

      expect(result).toStrictEqual({
        chaoswhispererExitCode,
        pathseekerExitCode: null,
        pathseekerSkipped: true,
        slotManagerResult: null,
        slotManagerSkipped: true,
      });
      expect(getQuest).not.toHaveBeenCalled();
    });
  });

  describe('error cases', () => {
    it('ERROR: ChaosWhisperer spawn error => rejects', async () => {
      const proxy = agentOrchestrateBrokerProxy();
      const error = new Error('ENOENT: claude command not found');

      proxy.setupChaoswhispererError({ error });

      const quest = proxy.createQuestReady();
      const getQuest = jest.fn().mockResolvedValue({ quest });

      const userInput = UserInputStub({ value: 'I need user authentication' });
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: '/quests/add-auth/quest.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();

      await expect(
        agentOrchestrateBroker({
          userInput,
          questId,
          questFilePath,
          slotCount,
          timeoutMs,
          slotOperations,
          getQuest,
        }),
      ).rejects.toThrow('ENOENT: claude command not found');
    });

    it('ERROR: PathSeeker spawn error => rejects', async () => {
      const proxy = agentOrchestrateBrokerProxy();
      const chaoswhispererExitCode = ExitCodeStub({ value: 0 });
      const error = new Error('EACCES: permission denied');

      proxy.setupChaoswhispererSuccess({ exitCode: chaoswhispererExitCode });
      proxy.setupPathseekerError({ error });

      const quest = proxy.createQuestReady();
      const getQuest = jest.fn().mockResolvedValue({ quest });

      const userInput = UserInputStub({ value: 'I need user authentication' });
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: '/quests/add-auth/quest.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();

      await expect(
        agentOrchestrateBroker({
          userInput,
          questId,
          questFilePath,
          slotCount,
          timeoutMs,
          slotOperations,
          getQuest,
        }),
      ).rejects.toThrow('EACCES: permission denied');
    });

    it('ERROR: SlotManager error => rejects', async () => {
      const proxy = agentOrchestrateBrokerProxy();
      const chaoswhispererExitCode = ExitCodeStub({ value: 0 });
      const pathseekerExitCode = ExitCodeStub({ value: 0 });
      const error = new Error('Quest file not found');

      proxy.setupChaoswhispererSuccess({ exitCode: chaoswhispererExitCode });
      proxy.setupPathseekerSuccess({ exitCode: pathseekerExitCode });
      proxy.setupSlotManagerError({ error });

      const quest = proxy.createQuestReady();
      const getQuest = jest.fn().mockResolvedValue({ quest });

      const userInput = UserInputStub({ value: 'I need user authentication' });
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: '/quests/add-auth/quest.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();

      await expect(
        agentOrchestrateBroker({
          userInput,
          questId,
          questFilePath,
          slotCount,
          timeoutMs,
          slotOperations,
          getQuest,
        }),
      ).rejects.toThrow('Failed to read file at /quests/add-auth/quest.json');
    });

    it('ERROR: getQuest rejection => rejects', async () => {
      const proxy = agentOrchestrateBrokerProxy();
      const chaoswhispererExitCode = ExitCodeStub({ value: 0 });

      proxy.setupChaoswhispererSuccess({ exitCode: chaoswhispererExitCode });

      const error = new Error('Quest not found in storage');
      const getQuest = jest.fn().mockRejectedValue(error);

      const userInput = UserInputStub({ value: 'I need user authentication' });
      const questId = QuestIdStub({ value: 'nonexistent-quest' });
      const questFilePath = FilePathStub({ value: '/quests/nonexistent/quest.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();

      await expect(
        agentOrchestrateBroker({
          userInput,
          questId,
          questFilePath,
          slotCount,
          timeoutMs,
          slotOperations,
          getQuest,
        }),
      ).rejects.toThrow('Quest not found in storage');
    });
  });

  describe('null exit code handling', () => {
    it('EDGE: ChaosWhisperer exits with null exit code => continues to getQuest', async () => {
      const proxy = agentOrchestrateBrokerProxy();

      proxy.setupChaoswhispererSuccessWithNullExitCode();

      const quest = proxy.createQuestNotReady();
      const getQuest = jest.fn().mockResolvedValue({ quest });

      const userInput = UserInputStub({ value: 'I need user authentication' });
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: '/quests/add-auth/quest.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();

      const result = await agentOrchestrateBroker({
        userInput,
        questId,
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        getQuest,
      });

      expect(getQuest).toHaveBeenCalledWith({ questId });
      expect(result).toStrictEqual({
        chaoswhispererExitCode: null,
        pathseekerExitCode: null,
        pathseekerSkipped: true,
        slotManagerResult: null,
        slotManagerSkipped: true,
      });
    });

    it('EDGE: ChaosWhisperer null exit, quest ready => runs PathSeeker and SlotManager', async () => {
      const proxy = agentOrchestrateBrokerProxy();
      const pathseekerExitCode = ExitCodeStub({ value: 0 });

      proxy.setupChaoswhispererSuccessWithNullExitCode();
      proxy.setupPathseekerSuccess({ exitCode: pathseekerExitCode });
      proxy.setupSlotManagerSuccess();

      const quest = proxy.createQuestReady();
      const getQuest = jest.fn().mockResolvedValue({ quest });

      const userInput = UserInputStub({ value: 'I need user authentication' });
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: '/quests/add-auth/quest.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();

      const result = await agentOrchestrateBroker({
        userInput,
        questId,
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        getQuest,
      });

      expect(result).toStrictEqual({
        chaoswhispererExitCode: null,
        pathseekerExitCode,
        pathseekerSkipped: false,
        slotManagerResult: { completed: true },
        slotManagerSkipped: false,
      });
    });

    it('EDGE: PathSeeker exits with null exit code => runs SlotManager', async () => {
      const proxy = agentOrchestrateBrokerProxy();
      const chaoswhispererExitCode = ExitCodeStub({ value: 0 });

      proxy.setupChaoswhispererSuccess({ exitCode: chaoswhispererExitCode });
      proxy.setupPathseekerSuccessWithNullExitCode();
      proxy.setupSlotManagerSuccess();

      const quest = proxy.createQuestReady();
      const getQuest = jest.fn().mockResolvedValue({ quest });

      const userInput = UserInputStub({ value: 'Add dark mode toggle' });
      const questId = QuestIdStub({ value: 'dark-mode' });
      const questFilePath = FilePathStub({ value: '/quests/dark-mode/quest.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();

      const result = await agentOrchestrateBroker({
        userInput,
        questId,
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        getQuest,
      });

      expect(result).toStrictEqual({
        chaoswhispererExitCode,
        pathseekerExitCode: null,
        pathseekerSkipped: false,
        slotManagerResult: { completed: true },
        slotManagerSkipped: false,
      });
    });
  });
});
