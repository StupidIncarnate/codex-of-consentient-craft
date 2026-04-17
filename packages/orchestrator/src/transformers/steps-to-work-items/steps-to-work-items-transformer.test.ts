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
      const flow = FlowStub({ id: FlowIdStub({ value: 'login-flow' }) });
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
          relatedDataItems: ['flows/login-flow'],
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
    it('VALID: {step B depends on step A, 1 flow} => codeweaver B depends on codeweaver A and pathseeker', () => {
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

      const flow = FlowStub({ id: FlowIdStub({ value: 'login-flow' }) });

      const pathseekerWorkItemId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
      });

      const result = stepsToWorkItemsTransformer({
        steps: [stepA, stepB],
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
          relatedDataItems: ['flows/login-flow'],
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

  describe('multi-flow siege chain', () => {
    it('VALID: {1 step, 3 flows} => 3 siege items chained, lawbringer depends on all 3, final ward depends on lawbringer', () => {
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

      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, dependsOn: [] });

      const flowA = FlowStub({ id: FlowIdStub({ value: 'login-flow' }) });
      const flowB = FlowStub({ id: FlowIdStub({ value: 'checkout-flow' }) });
      const flowC = FlowStub({ id: FlowIdStub({ value: 'profile-flow' }) });

      const pathseekerWorkItemId = QuestWorkItemIdStub({
        value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
      });

      const result = stepsToWorkItemsTransformer({
        steps: [step],
        flows: [flowA, flowB, flowC],
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
          relatedDataItems: ['flows/login-flow'],
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
          relatedDataItems: ['flows/checkout-flow'],
          dependsOn: [
            '00000000-0000-4000-8000-000000000002',
            '00000000-0000-4000-8000-000000000003',
          ],
          maxAttempts: 1,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: '00000000-0000-4000-8000-000000000005',
          role: 'siegemaster',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: ['flows/profile-flow'],
          dependsOn: [
            '00000000-0000-4000-8000-000000000002',
            '00000000-0000-4000-8000-000000000004',
          ],
          maxAttempts: 1,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: '00000000-0000-4000-8000-000000000006',
          role: 'lawbringer',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [`steps/${String(stepId)}`],
          dependsOn: [
            '00000000-0000-4000-8000-000000000003',
            '00000000-0000-4000-8000-000000000004',
            '00000000-0000-4000-8000-000000000005',
          ],
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
          dependsOn: ['00000000-0000-4000-8000-000000000006'],
          maxAttempts: 3,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
          wardMode: 'full',
        },
      ]);
    });
  });

  describe('empty flows guard', () => {
    it('VALID: {1 step, 0 flows} => 0 siege items, lawbringer depends on wardItem, final ward depends on lawbringer', () => {
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

  describe('final ward deps fallback', () => {
    it('VALID: {0 steps, 2 flows} => final ward depends on all siege items (no law items exist)', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      proxy.setupUuids({
        uuids: [
          '00000000-0000-4000-8000-000000000001',
          '00000000-0000-4000-8000-000000000002',
          '00000000-0000-4000-8000-000000000003',
          '00000000-0000-4000-8000-000000000004',
        ],
      });

      const flowA = FlowStub({ id: FlowIdStub({ value: 'login-flow' }) });
      const flowB = FlowStub({ id: FlowIdStub({ value: 'checkout-flow' }) });
      const pathseekerWorkItemId = QuestWorkItemIdStub({
        value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
      });

      const result = stepsToWorkItemsTransformer({
        steps: [],
        flows: [flowA, flowB],
        pathseekerWorkItemId,
        now: NOW,
      });

      expect(result).toStrictEqual([
        {
          id: '00000000-0000-4000-8000-000000000001',
          role: 'ward',
          status: 'pending',
          spawnerType: 'command',
          relatedDataItems: [],
          dependsOn: [],
          maxAttempts: 3,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
          wardMode: 'changed',
        },
        {
          id: '00000000-0000-4000-8000-000000000002',
          role: 'siegemaster',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: ['flows/login-flow'],
          dependsOn: ['00000000-0000-4000-8000-000000000001'],
          maxAttempts: 1,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: '00000000-0000-4000-8000-000000000003',
          role: 'siegemaster',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: ['flows/checkout-flow'],
          dependsOn: [
            '00000000-0000-4000-8000-000000000001',
            '00000000-0000-4000-8000-000000000002',
          ],
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
          dependsOn: [
            '00000000-0000-4000-8000-000000000002',
            '00000000-0000-4000-8000-000000000003',
          ],
          maxAttempts: 3,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
          wardMode: 'full',
        },
      ]);
    });
  });
});
