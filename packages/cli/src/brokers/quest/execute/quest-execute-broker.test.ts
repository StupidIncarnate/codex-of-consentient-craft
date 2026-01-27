import {
  FilePathStub,
  AbsoluteFilePathStub,
  QuestStub,
  DependencyStepStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import { questExecuteBroker } from './quest-execute-broker';
import { questExecuteBrokerProxy } from './quest-execute-broker.proxy';
import { ExecResultStub } from '../../../contracts/exec-result/exec-result.stub';
import { MaxIterationsStub } from '../../../contracts/max-iterations/max-iterations.stub';
import { SlotCountStub } from '../../../contracts/slot-count/slot-count.stub';
import { SlotOperationsStub } from '../../../contracts/slot-operations/slot-operations.stub';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';

describe('questExecuteBroker', () => {
  describe('full pipeline success', () => {
    it('VALID: {all phases complete} => returns completed true', async () => {
      const {
        pathseekerProxy,
        codeweaverProxy,
        siegemasterProxy,
        lawbringerProxy,
        spiritmenderLoopProxy,
      } = questExecuteBrokerProxy();

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

      const result = await questExecuteBroker({
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

  describe('pipeline with ward errors', () => {
    it('VALID: {ward has errors then passes} => returns completed true after spiritmender fixes', async () => {
      const {
        pathseekerProxy,
        codeweaverProxy,
        siegemasterProxy,
        lawbringerProxy,
        spiritmenderLoopProxy,
      } = questExecuteBrokerProxy();

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
          stdout: '/home/user/project/src/file.ts:10:5 - error TS123: Missing return type',
          stderr: '',
          exitCode: 1,
        }),
      });

      spiritmenderLoopProxy.spiritmenderPhaseProxy.slotManagerProxy.runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves(
        {
          content: questJson,
        },
      );

      const result = await questExecuteBroker({
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

  describe('multiple quest steps', () => {
    it('VALID: {quest with multiple steps} => returns completed true', async () => {
      const {
        pathseekerProxy,
        codeweaverProxy,
        siegemasterProxy,
        lawbringerProxy,
        spiritmenderLoopProxy,
      } = questExecuteBrokerProxy();

      const projectPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();
      const maxSpiritLoopIterations = MaxIterationsStub({ value: 3 });

      const stepId1 = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const stepId2 = StepIdStub({ value: 'b2c3d4e5-f6a7-5b8c-9d0e-1f2a3b4c5d6e' });
      const step1 = DependencyStepStub({ id: stepId1, status: 'complete', dependsOn: [] });
      const step2 = DependencyStepStub({ id: stepId2, status: 'complete', dependsOn: [stepId1] });
      const quest = QuestStub({ steps: [step1, step2] });
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

      const result = await questExecuteBroker({
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
});
