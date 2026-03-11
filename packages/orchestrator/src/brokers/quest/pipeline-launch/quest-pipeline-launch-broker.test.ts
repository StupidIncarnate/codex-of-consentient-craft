import {
  ExitCodeStub,
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import type { OrchestrationPhaseStub } from '../../../contracts/orchestration-phase/orchestration-phase.stub';
import { questPipelineLaunchBroker } from './quest-pipeline-launch-broker';
import { questPipelineLaunchBrokerProxy } from './quest-pipeline-launch-broker.proxy';

type OrchestrationPhase = ReturnType<typeof OrchestrationPhaseStub>;

describe('questPipelineLaunchBroker', () => {
  describe('successful launch', () => {
    it('VALID: {approved quest with path and guild} => launches pipeline without error', async () => {
      const proxy = questPipelineLaunchBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'approved', steps: [] });
      const questJson = JSON.stringify(quest);
      const exitCode = ExitCodeStub({ value: 0 });
      const processId = ProcessIdStub({ value: 'proc-test-launch' });
      const phases: OrchestrationPhase[] = [];

      proxy.setupLaunch({ quest, questJson, exitCode });

      await questPipelineLaunchBroker({
        processId,
        questId,
        onPhaseChange: ({ phase }) => {
          phases.push(phase);
        },
      });

      expect(phases[phases.length - 1]).toBe('complete');
    });
  });

  describe('onAgentLine passthrough', () => {
    it('VALID: {onAgentLine provided} => passes onAgentLine to pipeline broker without error', async () => {
      const proxy = questPipelineLaunchBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'approved', steps: [] });
      const questJson = JSON.stringify(quest);
      const exitCode = ExitCodeStub({ value: 0 });
      const processId = ProcessIdStub({ value: 'proc-test-agent-line' });
      const phases: OrchestrationPhase[] = [];

      proxy.setupLaunch({ quest, questJson, exitCode });

      await questPipelineLaunchBroker({
        processId,
        questId,
        onPhaseChange: ({ phase }) => {
          phases.push(phase);
        },
        onAgentLine: () => undefined,
      });

      expect(phases[phases.length - 1]).toBe('complete');
    });

    it('VALID: {onAgentLine undefined} => launches pipeline without onAgentLine', async () => {
      const proxy = questPipelineLaunchBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'approved', steps: [] });
      const questJson = JSON.stringify(quest);
      const exitCode = ExitCodeStub({ value: 0 });
      const processId = ProcessIdStub({ value: 'proc-test-no-agent-line' });
      const phases: OrchestrationPhase[] = [];

      proxy.setupLaunch({ quest, questJson, exitCode });

      await questPipelineLaunchBroker({
        processId,
        questId,
        onPhaseChange: ({ phase }) => {
          phases.push(phase);
        },
      });

      expect(phases[phases.length - 1]).toBe('complete');
    });
  });

  describe('error cases', () => {
    it('ERROR: {quest path not found} => throws quest not found error', async () => {
      const proxy = questPipelineLaunchBrokerProxy();
      const questId = QuestIdStub({ value: 'nonexistent' });
      const processId = ProcessIdStub({ value: 'proc-test-missing' });

      proxy.setupQuestPathNotFound();

      await expect(
        questPipelineLaunchBroker({
          processId,
          questId,
          onPhaseChange: () => undefined,
        }),
      ).rejects.toThrow(/not found/u);
    });
  });
});
