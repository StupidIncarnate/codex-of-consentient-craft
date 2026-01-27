import {
  AbsoluteFilePathStub,
  DependencyStepStub,
  FilePathStub,
  QuestStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import { ExecResultStub } from '../../../contracts/exec-result/exec-result.stub';
import { MaxIterationsStub } from '../../../contracts/max-iterations/max-iterations.stub';
import { SlotCountStub } from '../../../contracts/slot-count/slot-count.stub';
import { SlotOperationsStub } from '../../../contracts/slot-operations/slot-operations.stub';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';
import { agentOrchestrateBroker } from './agent-orchestrate-broker';
import { agentOrchestrateBrokerProxy } from './agent-orchestrate-broker.proxy';

describe('agentOrchestrateBroker', () => {
  describe('delegation to questExecuteBroker', () => {
    it('VALID: {all phases complete} => returns completed true', async () => {
      const {
        pathseekerProxy,
        codeweaverProxy,
        siegemasterProxy,
        lawbringerProxy,
        spiritmenderLoopProxy,
      } = agentOrchestrateBrokerProxy();

      const projectPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();
      const maxSpiritLoopIterations = MaxIterationsStub({ value: 3 });

      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, status: 'complete', dependsOn: [] });
      const quest = QuestStub({ steps: [step] });
      const questJson = JSON.stringify(quest);

      pathseekerProxy.slotManagerProxy.runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves(
        {
          content: questJson,
        },
      );

      codeweaverProxy.slotManagerProxy.runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves(
        {
          content: questJson,
        },
      );

      siegemasterProxy.slotManagerProxy.runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves(
        {
          content: questJson,
        },
      );

      lawbringerProxy.slotManagerProxy.runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves(
        {
          content: questJson,
        },
      );

      spiritmenderLoopProxy.wardRunProxy.execProxy.resolves({
        result: ExecResultStub({
          stdout: '',
          stderr: '',
          exitCode: 0,
        }),
      });

      spiritmenderLoopProxy.spiritmenderPhaseProxy.slotManagerProxy.runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves(
        {
          content: questJson,
        },
      );

      const result = await agentOrchestrateBroker({
        projectPath,
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        maxSpiritLoopIterations,
      });

      expect(result).toStrictEqual({ completed: true });
    });
  });

  describe('error propagation', () => {
    it('ERROR: {quest file read fails} => rejects with error', async () => {
      const { pathseekerProxy } = agentOrchestrateBrokerProxy();

      const projectPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();
      const maxSpiritLoopIterations = MaxIterationsStub({ value: 3 });

      pathseekerProxy.slotManagerProxy.runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.rejects(
        {
          error: new Error('Quest file not found'),
        },
      );

      await expect(
        agentOrchestrateBroker({
          projectPath,
          questFilePath,
          slotCount,
          timeoutMs,
          slotOperations,
          maxSpiritLoopIterations,
        }),
      ).rejects.toThrow('Failed to read file at /quests/quest-1.json');
    });
  });
});
