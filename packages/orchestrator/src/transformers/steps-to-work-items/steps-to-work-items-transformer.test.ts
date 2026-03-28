import {
  DependencyStepStub,
  FlowIdStub,
  FlowStub,
  QuestWorkItemIdStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import { IsoTimestampStub } from '../../contracts/iso-timestamp/iso-timestamp.stub';
import { stepsToWorkItemsTransformer } from './steps-to-work-items-transformer';
import { stepsToWorkItemsTransformerProxy } from './steps-to-work-items-transformer.proxy';

const NOW = IsoTimestampStub({ value: '2024-01-15T10:00:00.000Z' });

describe('stepsToWorkItemsTransformer', () => {
  describe('basic chain generation', () => {
    it('VALID: {1 step, 1 flow} => 1 codeweaver + 1 ward + 1 siege + 1 lawbringer + 1 final-ward', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      proxy.setupUuids({
        uuids: [
          '00000000-0000-4000-8000-000000000001',
          '00000000-0000-4000-8000-000000000002',
          '00000000-0000-4000-8000-000000000003',
          '00000000-0000-4000-8000-000000000004',
          '00000000-0000-4000-8000-000000000005',
        ],
      });

      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, dependsOn: [] });
      const flowId = FlowIdStub({ value: 'login-flow' });
      const flow = FlowStub({ id: flowId });
      const pathseekerWorkItemId = QuestWorkItemIdStub({
        value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
      });

      const result = stepsToWorkItemsTransformer({
        steps: [step],
        flows: [flow],
        pathseekerWorkItemId,
        now: NOW,
      });

      expect(result).toStrictEqual([
        {
          id: '00000000-0000-4000-8000-000000000001',
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [`steps/${String(stepId)}`],
          dependsOn: [pathseekerWorkItemId],
          maxAttempts: 1,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: '00000000-0000-4000-8000-000000000002',
          role: 'ward',
          status: 'pending',
          spawnerType: 'command',
          relatedDataItems: [],
          dependsOn: ['00000000-0000-4000-8000-000000000001'],
          maxAttempts: 3,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
          wardMode: 'changed',
        },
        {
          id: '00000000-0000-4000-8000-000000000003',
          role: 'siegemaster',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [`flows/${String(flowId)}`],
          dependsOn: ['00000000-0000-4000-8000-000000000002'],
          maxAttempts: 1,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: '00000000-0000-4000-8000-000000000004',
          role: 'lawbringer',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [`steps/${String(stepId)}`],
          dependsOn: ['00000000-0000-4000-8000-000000000003'],
          maxAttempts: 1,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: '00000000-0000-4000-8000-000000000005',
          role: 'ward',
          status: 'pending',
          spawnerType: 'command',
          relatedDataItems: [],
          dependsOn: ['00000000-0000-4000-8000-000000000004'],
          maxAttempts: 3,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
          wardMode: 'full',
        },
      ]);
    });
  });

  describe('step dependency DAG', () => {
    it('VALID: {step B depends on step A} => codeweaver B depends on codeweaver A and pathseeker', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      proxy.setupUuids({
        uuids: [
          '00000000-0000-4000-8000-000000000001',
          '00000000-0000-4000-8000-000000000002',
          '00000000-0000-4000-8000-000000000003',
          '00000000-0000-4000-8000-000000000004',
          '00000000-0000-4000-8000-000000000005',
          '00000000-0000-4000-8000-000000000006',
          '00000000-0000-4000-8000-000000000007',
        ],
      });

      const stepAId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const stepBId = StepIdStub({ value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' });

      const stepA = DependencyStepStub({ id: stepAId, dependsOn: [] });
      const stepB = DependencyStepStub({ id: stepBId, dependsOn: [stepAId] });
      const flowId = FlowIdStub({ value: 'login-flow' });

      const pathseekerWorkItemId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
      });

      const result = stepsToWorkItemsTransformer({
        steps: [stepA, stepB],
        flows: [FlowStub({ id: flowId })],
        pathseekerWorkItemId,
        now: NOW,
      });

      expect(result).toStrictEqual([
        {
          id: '00000000-0000-4000-8000-000000000001',
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [`steps/${String(stepAId)}`],
          dependsOn: [pathseekerWorkItemId],
          maxAttempts: 1,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: '00000000-0000-4000-8000-000000000002',
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [`steps/${String(stepBId)}`],
          dependsOn: [pathseekerWorkItemId, '00000000-0000-4000-8000-000000000001'],
          maxAttempts: 1,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: '00000000-0000-4000-8000-000000000003',
          role: 'ward',
          status: 'pending',
          spawnerType: 'command',
          relatedDataItems: [],
          dependsOn: [
            '00000000-0000-4000-8000-000000000001',
            '00000000-0000-4000-8000-000000000002',
          ],
          maxAttempts: 3,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
          wardMode: 'changed',
        },
        {
          id: '00000000-0000-4000-8000-000000000004',
          role: 'siegemaster',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [`flows/${String(flowId)}`],
          dependsOn: ['00000000-0000-4000-8000-000000000003'],
          maxAttempts: 1,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: '00000000-0000-4000-8000-000000000005',
          role: 'lawbringer',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [`steps/${String(stepAId)}`],
          dependsOn: ['00000000-0000-4000-8000-000000000004'],
          maxAttempts: 1,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: '00000000-0000-4000-8000-000000000006',
          role: 'lawbringer',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [`steps/${String(stepBId)}`],
          dependsOn: ['00000000-0000-4000-8000-000000000004'],
          maxAttempts: 1,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: '00000000-0000-4000-8000-000000000007',
          role: 'ward',
          status: 'pending',
          spawnerType: 'command',
          relatedDataItems: [],
          dependsOn: [
            '00000000-0000-4000-8000-000000000005',
            '00000000-0000-4000-8000-000000000006',
          ],
          maxAttempts: 3,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
          wardMode: 'full',
        },
      ]);
    });
  });

  describe('multiple flows', () => {
    it('VALID: {1 step, 2 flows} => 2 siege items with flow refs, lawbringer depends on both', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      proxy.setupUuids({
        uuids: [
          '00000000-0000-4000-8000-000000000001',
          '00000000-0000-4000-8000-000000000002',
          '00000000-0000-4000-8000-000000000003',
          '00000000-0000-4000-8000-000000000004',
          '00000000-0000-4000-8000-000000000005',
          '00000000-0000-4000-8000-000000000006',
        ],
      });

      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, dependsOn: [] });
      const flowAId = FlowIdStub({ value: 'login-flow' });
      const flowBId = FlowIdStub({ value: 'signup-flow' });
      const pathseekerWorkItemId = QuestWorkItemIdStub({
        value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
      });

      const result = stepsToWorkItemsTransformer({
        steps: [step],
        flows: [FlowStub({ id: flowAId }), FlowStub({ id: flowBId })],
        pathseekerWorkItemId,
        now: NOW,
      });

      expect(result).toStrictEqual([
        {
          id: '00000000-0000-4000-8000-000000000001',
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [`steps/${String(stepId)}`],
          dependsOn: [pathseekerWorkItemId],
          maxAttempts: 1,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: '00000000-0000-4000-8000-000000000002',
          role: 'ward',
          status: 'pending',
          spawnerType: 'command',
          relatedDataItems: [],
          dependsOn: ['00000000-0000-4000-8000-000000000001'],
          maxAttempts: 3,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
          wardMode: 'changed',
        },
        {
          id: '00000000-0000-4000-8000-000000000003',
          role: 'siegemaster',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [`flows/${String(flowAId)}`],
          dependsOn: ['00000000-0000-4000-8000-000000000002'],
          maxAttempts: 1,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: '00000000-0000-4000-8000-000000000004',
          role: 'siegemaster',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [`flows/${String(flowBId)}`],
          dependsOn: ['00000000-0000-4000-8000-000000000002'],
          maxAttempts: 1,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: '00000000-0000-4000-8000-000000000005',
          role: 'lawbringer',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [`steps/${String(stepId)}`],
          dependsOn: [
            '00000000-0000-4000-8000-000000000003',
            '00000000-0000-4000-8000-000000000004',
          ],
          maxAttempts: 1,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: '00000000-0000-4000-8000-000000000006',
          role: 'ward',
          status: 'pending',
          spawnerType: 'command',
          relatedDataItems: [],
          dependsOn: ['00000000-0000-4000-8000-000000000005'],
          maxAttempts: 3,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
          wardMode: 'full',
        },
      ]);
    });

    it('EDGE: {1 step, 0 flows} => 0 siege items, lawbringer depends on ward', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      proxy.setupUuids({
        uuids: [
          '00000000-0000-4000-8000-000000000001',
          '00000000-0000-4000-8000-000000000002',
          '00000000-0000-4000-8000-000000000003',
          '00000000-0000-4000-8000-000000000004',
        ],
      });

      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, dependsOn: [] });
      const pathseekerWorkItemId = QuestWorkItemIdStub({
        value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
      });

      const result = stepsToWorkItemsTransformer({
        steps: [step],
        flows: [],
        pathseekerWorkItemId,
        now: NOW,
      });

      expect(result).toStrictEqual([
        {
          id: '00000000-0000-4000-8000-000000000001',
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [`steps/${String(stepId)}`],
          dependsOn: [pathseekerWorkItemId],
          maxAttempts: 1,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: '00000000-0000-4000-8000-000000000002',
          role: 'ward',
          status: 'pending',
          spawnerType: 'command',
          relatedDataItems: [],
          dependsOn: ['00000000-0000-4000-8000-000000000001'],
          maxAttempts: 3,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
          wardMode: 'changed',
        },
        {
          id: '00000000-0000-4000-8000-000000000003',
          role: 'lawbringer',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [`steps/${String(stepId)}`],
          dependsOn: ['00000000-0000-4000-8000-000000000002'],
          maxAttempts: 1,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: '00000000-0000-4000-8000-000000000004',
          role: 'ward',
          status: 'pending',
          spawnerType: 'command',
          relatedDataItems: [],
          dependsOn: ['00000000-0000-4000-8000-000000000003'],
          maxAttempts: 3,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
          wardMode: 'full',
        },
      ]);
    });
  });
});
