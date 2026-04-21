import {
  DependencyStepStub,
  FlowIdStub,
  FlowStub,
  FolderTypeGroupsStub,
  QuestWorkItemIdStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import { IsoTimestampStub } from '../../contracts/iso-timestamp/iso-timestamp.stub';
import { stepsToWorkItemsTransformer } from './steps-to-work-items-transformer';
import { stepsToWorkItemsTransformerProxy } from './steps-to-work-items-transformer.proxy';

const NOW = IsoTimestampStub({ value: '2024-01-15T10:00:00.000Z' });

describe('stepsToWorkItemsTransformer', () => {
  describe('basic chain generation', () => {
    it('VALID: {1 step, 1 flow} => 1 codeweaver + 1 ward + 1 siege + 1 lawbringer + 1 blightwarden + 1 final-ward', () => {
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
      const flow = FlowStub({ id: FlowIdStub({ value: 'login-flow' }) });
      const pathseekerWorkItemId = QuestWorkItemIdStub({
        value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
      });

      const result = stepsToWorkItemsTransformer({
        steps: [step],
        flows: [flow],
        pathseekerWorkItemId,
        now: NOW,
        batchGroups: FolderTypeGroupsStub({ value: [] }),
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
          role: 'blightwarden',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [],
          dependsOn: ['00000000-0000-4000-8000-000000000004'],
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
          '00000000-0000-4000-8000-000000000008',
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
        batchGroups: FolderTypeGroupsStub({ value: [] }),
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
          role: 'blightwarden',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [],
          dependsOn: [
            '00000000-0000-4000-8000-000000000005',
            '00000000-0000-4000-8000-000000000006',
          ],
          maxAttempts: 1,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: '00000000-0000-4000-8000-000000000008',
          role: 'ward',
          status: 'pending',
          spawnerType: 'command',
          relatedDataItems: [],
          dependsOn: ['00000000-0000-4000-8000-000000000007'],
          maxAttempts: 3,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
          wardMode: 'full',
        },
      ]);
    });
  });

  describe('multi-flow siege chain', () => {
    it('VALID: {1 step, 3 flows} => 3 siege items chained, lawbringer depends on all 3, blightwarden depends on lawbringer, final ward depends on blightwarden', () => {
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
          '00000000-0000-4000-8000-000000000008',
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
        batchGroups: FolderTypeGroupsStub({ value: [] }),
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
          role: 'blightwarden',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [],
          dependsOn: ['00000000-0000-4000-8000-000000000006'],
          maxAttempts: 1,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: '00000000-0000-4000-8000-000000000008',
          role: 'ward',
          status: 'pending',
          spawnerType: 'command',
          relatedDataItems: [],
          dependsOn: ['00000000-0000-4000-8000-000000000007'],
          maxAttempts: 3,
          attempt: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
          wardMode: 'full',
        },
      ]);
    });
  });

  describe('empty flows guard', () => {
    it('VALID: {1 step, 0 flows} => 0 siege items, lawbringer depends on wardItem, blightwarden depends on lawbringer, final ward depends on blightwarden', () => {
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
      const pathseekerWorkItemId = QuestWorkItemIdStub({
        value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
      });

      const result = stepsToWorkItemsTransformer({
        steps: [step],
        flows: [],
        pathseekerWorkItemId,
        now: NOW,
        batchGroups: FolderTypeGroupsStub({ value: [] }),
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
          role: 'blightwarden',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [],
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

  describe('final ward deps fallback', () => {
    it('VALID: {0 steps, 2 flows} => blightwarden depends on all siege items (no law items exist), final ward depends on blightwarden', () => {
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
        batchGroups: FolderTypeGroupsStub({ value: [] }),
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
          role: 'blightwarden',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [],
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

  describe('forward-reference step dependencies', () => {
    it('VALID: {step B declared BEFORE step A, B depends on A} => codeweaver B depends on codeweaver A and pathseeker', () => {
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
          '00000000-0000-4000-8000-000000000008',
        ],
      });

      const stepAId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const stepBId = StepIdStub({ value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' });

      const stepB = DependencyStepStub({ id: stepBId, dependsOn: [stepAId] });
      const stepA = DependencyStepStub({ id: stepAId, dependsOn: [] });

      const flow = FlowStub({ id: FlowIdStub({ value: 'login-flow' }) });
      const pathseekerWorkItemId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
      });

      const result = stepsToWorkItemsTransformer({
        steps: [stepB, stepA],
        flows: [flow],
        pathseekerWorkItemId,
        now: NOW,
        batchGroups: FolderTypeGroupsStub({ value: [] }),
      });

      const codeweaverDeps = result
        .filter((wi) => wi.role === 'codeweaver')
        .map((wi) => wi.dependsOn);

      expect(codeweaverDeps).toStrictEqual([
        // Codeweaver B (declared first, uuid #1) — forward ref to A resolves to uuid #2
        [pathseekerWorkItemId, '00000000-0000-4000-8000-000000000002'],
        // Codeweaver A (declared second, uuid #2) — no step deps
        [pathseekerWorkItemId],
      ]);
    });

    it('VALID: {diamond pattern — step D depends on B and C, both depend on A, A declared LAST} => all resolve correctly', () => {
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
          '00000000-0000-4000-8000-000000000008',
          '00000000-0000-4000-8000-000000000009',
          '00000000-0000-4000-8000-00000000000a',
          '00000000-0000-4000-8000-00000000000b',
          '00000000-0000-4000-8000-00000000000c',
        ],
      });

      const stepAId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const stepBId = StepIdStub({ value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' });
      const stepCId = StepIdStub({ value: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f' });
      const stepDId = StepIdStub({ value: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f90' });

      const stepD = DependencyStepStub({ id: stepDId, dependsOn: [stepBId, stepCId] });
      const stepB = DependencyStepStub({ id: stepBId, dependsOn: [stepAId] });
      const stepC = DependencyStepStub({ id: stepCId, dependsOn: [stepAId] });
      const stepA = DependencyStepStub({ id: stepAId, dependsOn: [] });

      const flow = FlowStub({ id: FlowIdStub({ value: 'login-flow' }) });
      const pathseekerWorkItemId = QuestWorkItemIdStub({
        value: 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9012',
      });

      const result = stepsToWorkItemsTransformer({
        steps: [stepD, stepB, stepC, stepA],
        flows: [flow],
        pathseekerWorkItemId,
        now: NOW,
        batchGroups: FolderTypeGroupsStub({ value: [] }),
      });

      const codeweaverDeps = result
        .filter((wi) => wi.role === 'codeweaver')
        .map((wi) => wi.dependsOn);

      expect(codeweaverDeps).toStrictEqual([
        // Codeweaver D (uuid #1) depends on pathseeker, cw B (uuid #2), cw C (uuid #3)
        [
          pathseekerWorkItemId,
          '00000000-0000-4000-8000-000000000002',
          '00000000-0000-4000-8000-000000000003',
        ],
        // Codeweaver B (uuid #2) depends on pathseeker, cw A (uuid #4)
        [pathseekerWorkItemId, '00000000-0000-4000-8000-000000000004'],
        // Codeweaver C (uuid #3) depends on pathseeker, cw A (uuid #4)
        [pathseekerWorkItemId, '00000000-0000-4000-8000-000000000004'],
        // Codeweaver A (uuid #4) depends on pathseeker only
        [pathseekerWorkItemId],
      ]);
    });

    it('VALID: {long chain mixed refs — step 1 depends on 3, step 3 depends on 5, step 5 no deps} => chain resolves', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      proxy.setupUuids({
        uuids: [
          // 5 codeweaver ids (one per step)
          '00000000-0000-4000-8000-000000000001',
          '00000000-0000-4000-8000-000000000002',
          '00000000-0000-4000-8000-000000000003',
          '00000000-0000-4000-8000-000000000004',
          '00000000-0000-4000-8000-000000000005',
          // ward + siege + 5 lawbringers + blightwarden + finalWard = 9 more
          '00000000-0000-4000-8000-000000000006',
          '00000000-0000-4000-8000-000000000007',
          '00000000-0000-4000-8000-000000000008',
          '00000000-0000-4000-8000-000000000009',
          '00000000-0000-4000-8000-00000000000a',
          '00000000-0000-4000-8000-00000000000b',
          '00000000-0000-4000-8000-00000000000c',
          '00000000-0000-4000-8000-00000000000d',
          '00000000-0000-4000-8000-00000000000e',
        ],
      });

      const step1Id = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c01' });
      const step2Id = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c02' });
      const step3Id = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c03' });
      const step4Id = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c04' });
      const step5Id = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c05' });

      const step1 = DependencyStepStub({ id: step1Id, dependsOn: [step3Id] });
      const step2 = DependencyStepStub({ id: step2Id, dependsOn: [] });
      const step3 = DependencyStepStub({ id: step3Id, dependsOn: [step5Id] });
      const step4 = DependencyStepStub({ id: step4Id, dependsOn: [] });
      const step5 = DependencyStepStub({ id: step5Id, dependsOn: [] });

      const flow = FlowStub({ id: FlowIdStub({ value: 'login-flow' }) });
      const pathseekerWorkItemId = QuestWorkItemIdStub({
        value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
      });

      const result = stepsToWorkItemsTransformer({
        steps: [step1, step2, step3, step4, step5],
        flows: [flow],
        pathseekerWorkItemId,
        now: NOW,
        batchGroups: FolderTypeGroupsStub({ value: [] }),
      });

      const codeweaverDeps = result
        .filter((wi) => wi.role === 'codeweaver')
        .map((wi) => wi.dependsOn);

      expect(codeweaverDeps).toStrictEqual([
        // cw1 (uuid #1) depends on pathseeker + cw3 (uuid #3)
        [pathseekerWorkItemId, '00000000-0000-4000-8000-000000000003'],
        // cw2 (uuid #2) — no step deps
        [pathseekerWorkItemId],
        // cw3 (uuid #3) depends on pathseeker + cw5 (uuid #5)
        [pathseekerWorkItemId, '00000000-0000-4000-8000-000000000005'],
        // cw4 (uuid #4) — no step deps
        [pathseekerWorkItemId],
        // cw5 (uuid #5) — no step deps
        [pathseekerWorkItemId],
      ]);
    });

    it('VALID: {non-existent step id in dependsOn} => silently dropped (no throw) — documents current behavior', () => {
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

      const realId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const ghostId = StepIdStub({ value: 'ffffffff-ffff-4fff-8fff-ffffffffffff' });

      const step = DependencyStepStub({ id: realId, dependsOn: [ghostId] });
      const flow = FlowStub({ id: FlowIdStub({ value: 'login-flow' }) });
      const pathseekerWorkItemId = QuestWorkItemIdStub({
        value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
      });

      const result = stepsToWorkItemsTransformer({
        steps: [step],
        flows: [flow],
        pathseekerWorkItemId,
        now: NOW,
        batchGroups: FolderTypeGroupsStub({ value: [] }),
      });

      const codeweaverDeps = result
        .filter((wi) => wi.role === 'codeweaver')
        .map((wi) => wi.dependsOn);

      expect(codeweaverDeps).toStrictEqual([[pathseekerWorkItemId]]);
    });

    it('VALID: {circular dep — A depends on B, B depends on A} => both resolve (cycle not detected here) — documents current behavior', () => {
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
          '00000000-0000-4000-8000-000000000008',
        ],
      });

      const stepAId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const stepBId = StepIdStub({ value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' });

      const stepA = DependencyStepStub({ id: stepAId, dependsOn: [stepBId] });
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
        batchGroups: FolderTypeGroupsStub({ value: [] }),
      });

      const codeweaverDeps = result
        .filter((wi) => wi.role === 'codeweaver')
        .map((wi) => wi.dependsOn);

      // Cycle detection is a separate guard; this transformer wires deps regardless.
      expect(codeweaverDeps).toStrictEqual([
        // cw A (uuid #1) depends on pathseeker + cw B (uuid #2)
        [pathseekerWorkItemId, '00000000-0000-4000-8000-000000000002'],
        // cw B (uuid #2) depends on pathseeker + cw A (uuid #1)
        [pathseekerWorkItemId, '00000000-0000-4000-8000-000000000001'],
      ]);
    });
  });

  describe('blightwarden dependency wiring', () => {
    it('VALID: {1 step, 1 flow} => blightwardenItem depends on allLawIds; finalWard depends on [blightwardenItem.id]', () => {
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
      const flow = FlowStub({ id: FlowIdStub({ value: 'login-flow' }) });
      const pathseekerWorkItemId = QuestWorkItemIdStub({
        value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
      });

      const result = stepsToWorkItemsTransformer({
        steps: [step],
        flows: [flow],
        pathseekerWorkItemId,
        now: NOW,
        batchGroups: FolderTypeGroupsStub({ value: [] }),
      });

      const [, , , , blightwardenItem, finalWardItem] = result;

      expect(blightwardenItem?.role).toBe('blightwarden');
      expect(blightwardenItem?.dependsOn).toStrictEqual(['00000000-0000-4000-8000-000000000004']);
      expect(finalWardItem?.role).toBe('ward');
      expect(finalWardItem?.wardMode).toBe('full');
      expect(finalWardItem?.dependsOn).toStrictEqual(['00000000-0000-4000-8000-000000000005']);
    });

    it('VALID: {0 steps, 1 flow} => blightwardenItem depends on allSiegeIds; finalWard depends on [blightwardenItem.id]', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      proxy.setupUuids({
        uuids: [
          '00000000-0000-4000-8000-000000000001',
          '00000000-0000-4000-8000-000000000002',
          '00000000-0000-4000-8000-000000000003',
          '00000000-0000-4000-8000-000000000004',
        ],
      });

      const flow = FlowStub({ id: FlowIdStub({ value: 'login-flow' }) });
      const pathseekerWorkItemId = QuestWorkItemIdStub({
        value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
      });

      const result = stepsToWorkItemsTransformer({
        steps: [],
        flows: [flow],
        pathseekerWorkItemId,
        now: NOW,
        batchGroups: FolderTypeGroupsStub({ value: [] }),
      });

      const [, , blightwardenItem, finalWardItem] = result;

      expect(blightwardenItem?.role).toBe('blightwarden');
      expect(blightwardenItem?.dependsOn).toStrictEqual(['00000000-0000-4000-8000-000000000002']);
      expect(finalWardItem?.role).toBe('ward');
      expect(finalWardItem?.wardMode).toBe('full');
      expect(finalWardItem?.dependsOn).toStrictEqual(['00000000-0000-4000-8000-000000000003']);
    });

    it('VALID: {1 step, 0 flows} => blightwardenItem depends on allLawIds; finalWard depends on [blightwardenItem.id]', () => {
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
      const pathseekerWorkItemId = QuestWorkItemIdStub({
        value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
      });

      const result = stepsToWorkItemsTransformer({
        steps: [step],
        flows: [],
        pathseekerWorkItemId,
        now: NOW,
        batchGroups: FolderTypeGroupsStub({ value: [] }),
      });

      const [, , , blightwardenItem, finalWardItem] = result;

      expect(blightwardenItem?.role).toBe('blightwarden');
      expect(blightwardenItem?.dependsOn).toStrictEqual(['00000000-0000-4000-8000-000000000003']);
      expect(finalWardItem?.role).toBe('ward');
      expect(finalWardItem?.wardMode).toBe('full');
      expect(finalWardItem?.dependsOn).toStrictEqual(['00000000-0000-4000-8000-000000000004']);
    });
  });
});
