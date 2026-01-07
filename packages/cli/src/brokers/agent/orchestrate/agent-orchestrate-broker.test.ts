import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { ExitCodeStub, QuestIdStub, UserInputStub } from '@dungeonmaster/shared/contracts';

import { agentOrchestrateBroker } from './agent-orchestrate-broker';
import { agentOrchestrateBrokerProxy } from './agent-orchestrate-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;
type QuestId = ReturnType<typeof QuestIdStub>;

describe('agentOrchestrateBroker', () => {
  describe('successful pipeline', () => {
    it('VALID: ChaosWhisperer succeeds, quest ready => spawns PathSeeker', async () => {
      const proxy = agentOrchestrateBrokerProxy();
      const chaoswhispererExitCode = ExitCodeStub({ value: 0 });
      const pathseekerExitCode = ExitCodeStub({ value: 0 });

      proxy.setupChaoswhispererSuccess({ exitCode: chaoswhispererExitCode });
      proxy.setupPathseekerSuccess({ exitCode: pathseekerExitCode });

      const quest = proxy.createQuestReady();
      const getQuest = jest.fn().mockResolvedValue({ quest });

      const userInput = UserInputStub({ value: 'I need user authentication' });
      const questId = QuestIdStub({ value: 'add-auth' });

      const result = await agentOrchestrateBroker({ userInput, questId, getQuest });

      expect(result).toStrictEqual({
        chaoswhispererExitCode,
        pathseekerExitCode,
        pathseekerSkipped: false,
      });
    });

    it('VALID: ChaosWhisperer succeeds, quest NOT ready => skips PathSeeker', async () => {
      const proxy = agentOrchestrateBrokerProxy();
      const chaoswhispererExitCode = ExitCodeStub({ value: 0 });

      proxy.setupChaoswhispererSuccess({ exitCode: chaoswhispererExitCode });

      const quest = proxy.createQuestNotReady();
      const getQuest = jest.fn().mockResolvedValue({ quest });

      const userInput = UserInputStub({ value: 'I need user authentication' });
      const questId = QuestIdStub({ value: 'add-auth' });

      const result = await agentOrchestrateBroker({ userInput, questId, getQuest });

      expect(result).toStrictEqual({
        chaoswhispererExitCode,
        pathseekerExitCode: null,
        pathseekerSkipped: true,
      });
    });

    it('VALID: PathSeeker exits with code 0 => returns success', async () => {
      const proxy = agentOrchestrateBrokerProxy();
      const chaoswhispererExitCode = ExitCodeStub({ value: 0 });
      const pathseekerExitCode = ExitCodeStub({ value: 0 });

      proxy.setupChaoswhispererSuccess({ exitCode: chaoswhispererExitCode });
      proxy.setupPathseekerSuccess({ exitCode: pathseekerExitCode });

      const quest = proxy.createQuestReady();
      const getQuest = jest.fn().mockResolvedValue({ quest });

      const userInput = UserInputStub({ value: 'Add dark mode toggle' });
      const questId = QuestIdStub({ value: 'dark-mode' });

      const result = await agentOrchestrateBroker({ userInput, questId, getQuest });

      expect(result).toStrictEqual({
        chaoswhispererExitCode,
        pathseekerExitCode,
        pathseekerSkipped: false,
      });
    });

    it('VALID: PathSeeker exits with code 1 => returns PathSeeker exit code', async () => {
      const proxy = agentOrchestrateBrokerProxy();
      const chaoswhispererExitCode = ExitCodeStub({ value: 0 });
      const pathseekerExitCode = ExitCodeStub({ value: 1 });

      proxy.setupChaoswhispererSuccess({ exitCode: chaoswhispererExitCode });
      proxy.setupPathseekerSuccess({ exitCode: pathseekerExitCode });

      const quest = proxy.createQuestReady();
      const getQuest = jest.fn().mockResolvedValue({ quest });

      const userInput = UserInputStub({ value: 'I need user authentication' });
      const questId = QuestIdStub({ value: 'add-auth' });

      const result = await agentOrchestrateBroker({ userInput, questId, getQuest });

      expect(result).toStrictEqual({
        chaoswhispererExitCode,
        pathseekerExitCode,
        pathseekerSkipped: false,
      });
    });
  });

  describe('ChaosWhisperer non-zero exit', () => {
    it('VALID: ChaosWhisperer exits with code 1 => skips PathSeeker, returns early', async () => {
      const proxy = agentOrchestrateBrokerProxy();
      const chaoswhispererExitCode = ExitCodeStub({ value: 1 });

      proxy.setupChaoswhispererSuccess({ exitCode: chaoswhispererExitCode });

      const getQuest = jest.fn<Promise<{ quest: Quest }>, [{ questId: QuestId }]>();

      const userInput = UserInputStub({ value: 'I need user authentication' });
      const questId = QuestIdStub({ value: 'add-auth' });

      const result = await agentOrchestrateBroker({ userInput, questId, getQuest });

      expect(result).toStrictEqual({
        chaoswhispererExitCode,
        pathseekerExitCode: null,
        pathseekerSkipped: true,
      });
      expect(getQuest).not.toHaveBeenCalled();
    });

    it('VALID: ChaosWhisperer exits with code 130 (SIGINT) => skips PathSeeker', async () => {
      const proxy = agentOrchestrateBrokerProxy();
      const chaoswhispererExitCode = ExitCodeStub({ value: 130 });

      proxy.setupChaoswhispererSuccess({ exitCode: chaoswhispererExitCode });

      const getQuest = jest.fn<Promise<{ quest: Quest }>, [{ questId: QuestId }]>();

      const userInput = UserInputStub({ value: 'I need user authentication' });
      const questId = QuestIdStub({ value: 'add-auth' });

      const result = await agentOrchestrateBroker({ userInput, questId, getQuest });

      expect(result).toStrictEqual({
        chaoswhispererExitCode,
        pathseekerExitCode: null,
        pathseekerSkipped: true,
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

      await expect(agentOrchestrateBroker({ userInput, questId, getQuest })).rejects.toThrow(
        'ENOENT: claude command not found',
      );
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

      await expect(agentOrchestrateBroker({ userInput, questId, getQuest })).rejects.toThrow(
        'EACCES: permission denied',
      );
    });
  });
});
