import {
  FilePathStub,
  AbsoluteFilePathStub,
  QuestStub,
  DependencyStepStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import { spiritmenderLoopLayerBroker } from './spiritmender-loop-layer-broker';
import { spiritmenderLoopLayerBrokerProxy } from './spiritmender-loop-layer-broker.proxy';
import { ExecResultStub } from '../../../contracts/exec-result/exec-result.stub';
import { MaxIterationsStub } from '../../../contracts/max-iterations/max-iterations.stub';
import { SlotCountStub } from '../../../contracts/slot-count/slot-count.stub';
import { SlotOperationsStub } from '../../../contracts/slot-operations/slot-operations.stub';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';

describe('spiritmenderLoopLayerBroker', () => {
  describe('ward passes immediately', () => {
    it('VALID: {ward succeeds} => returns completed true without spiritmender', async () => {
      const { wardRunProxy, spiritmenderPhaseProxy } = spiritmenderLoopLayerBrokerProxy();
      const projectPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();
      const maxIterations = MaxIterationsStub({ value: 3 });

      wardRunProxy.execProxy.resolves({
        result: ExecResultStub({
          stdout: '',
          stderr: '',
          exitCode: 0,
        }),
      });

      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, status: 'complete', dependsOn: [] });
      const quest = QuestStub({ steps: [step] });

      spiritmenderPhaseProxy.slotManagerProxy.runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves(
        {
          content: JSON.stringify(quest),
        },
      );

      const result = await spiritmenderLoopLayerBroker({
        projectPath,
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        maxIterations,
      });

      expect(result).toStrictEqual({ completed: true });
    });
  });

  describe('ward fails then passes', () => {
    it('VALID: {ward fails then succeeds} => returns completed true after spiritmender fixes', async () => {
      const { wardRunProxy, spiritmenderPhaseProxy } = spiritmenderLoopLayerBrokerProxy();
      const projectPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();
      const maxIterations = MaxIterationsStub({ value: 3 });

      const errorOutput = '/home/user/project/src/file.ts:10:5 - error TS123: Missing return type';

      wardRunProxy.execProxy.resolves({
        result: ExecResultStub({
          stdout: errorOutput,
          stderr: '',
          exitCode: 1,
        }),
      });

      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, status: 'complete', dependsOn: [] });
      const quest = QuestStub({ steps: [step] });

      spiritmenderPhaseProxy.slotManagerProxy.runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves(
        {
          content: JSON.stringify(quest),
        },
      );

      const result = await spiritmenderLoopLayerBroker({
        projectPath,
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        maxIterations,
      });

      expect(result).toStrictEqual({ completed: true });
    });
  });

  describe('max iterations reached', () => {
    it('VALID: {ward keeps failing} => returns completed true after max iterations', async () => {
      const { wardRunProxy, spiritmenderPhaseProxy } = spiritmenderLoopLayerBrokerProxy();
      const projectPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();
      const maxIterations = MaxIterationsStub({ value: 1 });

      const errorOutput = '/home/user/project/src/file.ts:10:5 - error TS123: Missing return type';

      wardRunProxy.execProxy.resolves({
        result: ExecResultStub({
          stdout: errorOutput,
          stderr: '',
          exitCode: 1,
        }),
      });

      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, status: 'complete', dependsOn: [] });
      const quest = QuestStub({ steps: [step] });

      spiritmenderPhaseProxy.slotManagerProxy.runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves(
        {
          content: JSON.stringify(quest),
        },
      );

      const result = await spiritmenderLoopLayerBroker({
        projectPath,
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        maxIterations,
      });

      expect(result).toStrictEqual({ completed: true });
    });
  });

  describe('no errors in ward output', () => {
    it('EDGE: {ward fails but no parseable errors} => returns completed true', async () => {
      const { wardRunProxy, spiritmenderPhaseProxy } = spiritmenderLoopLayerBrokerProxy();
      const projectPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const slotCount = SlotCountStub({ value: 3 });
      const timeoutMs = TimeoutMsStub({ value: 60000 });
      const slotOperations = SlotOperationsStub();
      const maxIterations = MaxIterationsStub({ value: 3 });

      wardRunProxy.execProxy.resolves({
        result: ExecResultStub({
          stdout: 'Some unparseable output',
          stderr: '',
          exitCode: 1,
        }),
      });

      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, status: 'complete', dependsOn: [] });
      const quest = QuestStub({ steps: [step] });

      spiritmenderPhaseProxy.slotManagerProxy.runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves(
        {
          content: JSON.stringify(quest),
        },
      );

      const result = await spiritmenderLoopLayerBroker({
        projectPath,
        questFilePath,
        slotCount,
        timeoutMs,
        slotOperations,
        maxIterations,
      });

      expect(result).toStrictEqual({ completed: true });
    });
  });
});
