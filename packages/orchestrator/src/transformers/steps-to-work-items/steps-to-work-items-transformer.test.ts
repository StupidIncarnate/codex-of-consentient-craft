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

// Sequential UUIDs the proxy hands crypto.randomUUID() in order. The blightwarden phase mints
// FIVE minion items + ONE synthesizer, so chains are longer than the legacy single-blightwarden
// shape — every test slices off as many ids as its full chain needs.
const IDS = [
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
  '00000000-0000-4000-8000-00000000000d',
  '00000000-0000-4000-8000-00000000000e',
  '00000000-0000-4000-8000-00000000000f',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000012',
  '00000000-0000-4000-8000-000000000013',
] as const;

const MINION_ROLES = [
  'blightwarden-security-minion',
  'blightwarden-dedup-minion',
  'blightwarden-perf-minion',
  'blightwarden-integrity-minion',
  'blightwarden-dead-code-minion',
] as const;

describe('stepsToWorkItemsTransformer', () => {
  describe('basic chain generation', () => {
    it('VALID: {1 step, 1 flow} => 1 codeweaver + 1 ward + 1 siege + 1 lawbringer + 5 minions + 1 blightwarden + 1 final-ward', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      proxy.setupUuids({ uuids: IDS.slice(0, 11) });

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
          id: IDS[0],
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [`steps/${String(stepId)}`],
          dependsOn: [pathseekerWorkItemId],
          maxAttempts: 1,
          attempt: 0,
          retryCount: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: IDS[1],
          role: 'ward',
          status: 'pending',
          spawnerType: 'command',
          relatedDataItems: [],
          dependsOn: [IDS[0]],
          maxAttempts: 3,
          attempt: 0,
          retryCount: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
          wardMode: 'changed',
        },
        {
          id: IDS[2],
          role: 'siegemaster',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: ['flows/login-flow'],
          dependsOn: [IDS[1]],
          maxAttempts: 1,
          attempt: 0,
          retryCount: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: IDS[3],
          role: 'lawbringer',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [`steps/${String(stepId)}`],
          dependsOn: [IDS[2]],
          maxAttempts: 1,
          attempt: 0,
          retryCount: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: IDS[4],
          role: 'blightwarden-security-minion',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [],
          dependsOn: [IDS[3]],
          maxAttempts: 1,
          attempt: 0,
          retryCount: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: IDS[5],
          role: 'blightwarden-dedup-minion',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [],
          dependsOn: [IDS[3]],
          maxAttempts: 1,
          attempt: 0,
          retryCount: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: IDS[6],
          role: 'blightwarden-perf-minion',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [],
          dependsOn: [IDS[3]],
          maxAttempts: 1,
          attempt: 0,
          retryCount: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: IDS[7],
          role: 'blightwarden-integrity-minion',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [],
          dependsOn: [IDS[3]],
          maxAttempts: 1,
          attempt: 0,
          retryCount: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: IDS[8],
          role: 'blightwarden-dead-code-minion',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [],
          dependsOn: [IDS[3]],
          maxAttempts: 1,
          attempt: 0,
          retryCount: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: IDS[9],
          role: 'blightwarden',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [],
          dependsOn: [IDS[4], IDS[5], IDS[6], IDS[7], IDS[8]],
          maxAttempts: 1,
          attempt: 0,
          retryCount: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: IDS[10],
          role: 'ward',
          status: 'pending',
          spawnerType: 'command',
          relatedDataItems: [],
          dependsOn: [IDS[9]],
          maxAttempts: 3,
          attempt: 0,
          retryCount: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
          wardMode: 'full',
        },
      ]);
    });
  });

  describe('blightwarden minion + synthesizer wiring', () => {
    it('VALID: {1 step, 1 flow} => 5 minions all depend on the lawbringer; synthesizer depends on all 5 minions; final ward depends on synthesizer', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      proxy.setupUuids({ uuids: IDS.slice(0, 11) });

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

      const minions = result.filter((wi) => wi.role.endsWith('-minion'));
      const synthesizer = result.find((wi) => wi.role === 'blightwarden');
      const finalWard = result.filter((wi) => wi.role === 'ward').at(-1);

      // Five minions, in concern order, each depending on the single lawbringer (id #4).
      expect(minions.map((wi) => wi.role)).toStrictEqual([...MINION_ROLES]);
      expect(minions.map((wi) => wi.dependsOn)).toStrictEqual([
        [IDS[3]],
        [IDS[3]],
        [IDS[3]],
        [IDS[3]],
        [IDS[3]],
      ]);
      // Synthesizer depends on all five minion ids.
      expect(synthesizer?.dependsOn).toStrictEqual([IDS[4], IDS[5], IDS[6], IDS[7], IDS[8]]);
      // Final ward depends on the synthesizer only.
      expect(finalWard?.dependsOn).toStrictEqual([IDS[9]]);
      expect(finalWard?.wardMode).toBe('full');
    });

    it('VALID: {0 steps, 1 flow} => minions depend on the siege item (no lawbringers exist)', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      proxy.setupUuids({ uuids: IDS.slice(0, 9) });

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

      // ward (#1) + siege (#2) + 5 minions (#3-#7) + synthesizer (#8) + final ward (#9)
      const minions = result.filter((wi) => wi.role.endsWith('-minion'));

      expect(minions.map((wi) => wi.dependsOn)).toStrictEqual([
        [IDS[1]],
        [IDS[1]],
        [IDS[1]],
        [IDS[1]],
        [IDS[1]],
      ]);

      const synthesizer = result.find((wi) => wi.role === 'blightwarden');

      expect(synthesizer?.dependsOn).toStrictEqual([IDS[2], IDS[3], IDS[4], IDS[5], IDS[6]]);
    });

    it('VALID: {1 step, 0 flows} => minions depend on the lawbringer (no sieges exist)', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      proxy.setupUuids({ uuids: IDS.slice(0, 10) });

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

      // codeweaver (#1) + ward (#2) + lawbringer (#3) + 5 minions (#4-#8) + synthesizer (#9) + final ward (#10)
      const minions = result.filter((wi) => wi.role.endsWith('-minion'));

      expect(minions.map((wi) => wi.dependsOn)).toStrictEqual([
        [IDS[2]],
        [IDS[2]],
        [IDS[2]],
        [IDS[2]],
        [IDS[2]],
      ]);

      const synthesizer = result.find((wi) => wi.role === 'blightwarden');

      expect(synthesizer?.dependsOn).toStrictEqual([IDS[3], IDS[4], IDS[5], IDS[6], IDS[7]]);

      const finalWard = result.filter((wi) => wi.role === 'ward').at(-1);

      expect(finalWard?.dependsOn).toStrictEqual([IDS[8]]);
    });

    it('VALID: {0 steps, 0 flows} => minions depend on the ward item (empty-flows edge)', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      proxy.setupUuids({ uuids: IDS.slice(0, 8) });

      const pathseekerWorkItemId = QuestWorkItemIdStub({
        value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
      });

      const result = stepsToWorkItemsTransformer({
        steps: [],
        flows: [],
        pathseekerWorkItemId,
        now: NOW,
        batchGroups: FolderTypeGroupsStub({ value: [] }),
      });

      // ward (#1) + 5 minions (#2-#6) + synthesizer (#7) + final ward (#8)
      const minions = result.filter((wi) => wi.role.endsWith('-minion'));

      expect(minions.map((wi) => wi.dependsOn)).toStrictEqual([
        [IDS[0]],
        [IDS[0]],
        [IDS[0]],
        [IDS[0]],
        [IDS[0]],
      ]);
    });
  });

  describe('step dependency DAG', () => {
    it('VALID: {step B depends on step A, 1 flow} => codeweaver B depends on codeweaver A and pathseeker', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      proxy.setupUuids({ uuids: IDS.slice(0, 13) });

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

      const codeweaverDeps = result
        .filter((wi) => wi.role === 'codeweaver')
        .map((wi) => wi.dependsOn);

      expect(codeweaverDeps).toStrictEqual([
        [pathseekerWorkItemId],
        [pathseekerWorkItemId, IDS[0]],
      ]);
    });
  });

  describe('multi-flow siege chain', () => {
    it('VALID: {1 step, 3 flows} => 3 siege items chained; lawbringer depends on all 3; minions depend on lawbringer; synthesizer depends on minions; final ward depends on synthesizer', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      proxy.setupUuids({ uuids: IDS.slice(0, 13) });

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

      // cw (#1) + ward (#2) + 3 sieges (#3-#5) + lawbringer (#6) + 5 minions (#7-#11) + synth (#12) + final ward (#13)
      const lawbringer = result.find((wi) => wi.role === 'lawbringer');

      expect(lawbringer?.dependsOn).toStrictEqual([IDS[2], IDS[3], IDS[4]]);

      const minions = result.filter((wi) => wi.role.endsWith('-minion'));

      expect(minions.map((wi) => wi.role)).toStrictEqual([...MINION_ROLES]);
      expect(minions.map((wi) => wi.dependsOn)).toStrictEqual([
        [IDS[5]],
        [IDS[5]],
        [IDS[5]],
        [IDS[5]],
        [IDS[5]],
      ]);

      const synthesizer = result.find((wi) => wi.role === 'blightwarden');

      expect(synthesizer?.dependsOn).toStrictEqual([IDS[6], IDS[7], IDS[8], IDS[9], IDS[10]]);

      const finalWard = result.filter((wi) => wi.role === 'ward').at(-1);

      expect(finalWard?.dependsOn).toStrictEqual([IDS[11]]);
    });
  });

  describe('forward-reference step dependencies', () => {
    it('VALID: {step B declared BEFORE step A, B depends on A} => codeweaver B depends on codeweaver A and pathseeker', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      proxy.setupUuids({ uuids: IDS.slice(0, 13) });

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
        // Codeweaver B (declared first, id #1) — forward ref to A resolves to id #2
        [pathseekerWorkItemId, IDS[1]],
        // Codeweaver A (declared second, id #2) — no step deps
        [pathseekerWorkItemId],
      ]);
    });

    it('VALID: {diamond pattern — step D depends on B and C, both depend on A, A declared LAST} => all resolve correctly', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      proxy.setupUuids({ uuids: IDS.slice(0, 17) });

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
        // Codeweaver D (id #1) depends on pathseeker, cw B (id #2), cw C (id #3)
        [pathseekerWorkItemId, IDS[1], IDS[2]],
        // Codeweaver B (id #2) depends on pathseeker, cw A (id #4)
        [pathseekerWorkItemId, IDS[3]],
        // Codeweaver C (id #3) depends on pathseeker, cw A (id #4)
        [pathseekerWorkItemId, IDS[3]],
        // Codeweaver A (id #4) depends on pathseeker only
        [pathseekerWorkItemId],
      ]);
    });

    it('VALID: {long chain mixed refs — step 1 depends on 3, step 3 depends on 5, step 5 no deps} => chain resolves', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      proxy.setupUuids({ uuids: IDS.slice(0, 19) });

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
        // cw1 (id #1) depends on pathseeker + cw3 (id #3)
        [pathseekerWorkItemId, IDS[2]],
        // cw2 (id #2) — no step deps
        [pathseekerWorkItemId],
        // cw3 (id #3) depends on pathseeker + cw5 (id #5)
        [pathseekerWorkItemId, IDS[4]],
        // cw4 (id #4) — no step deps
        [pathseekerWorkItemId],
        // cw5 (id #5) — no step deps
        [pathseekerWorkItemId],
      ]);
    });

    it('VALID: {non-existent step id in dependsOn} => silently dropped (no throw) — documents current behavior', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      proxy.setupUuids({ uuids: IDS.slice(0, 11) });

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
      proxy.setupUuids({ uuids: IDS.slice(0, 13) });

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
        // cw A (id #1) depends on pathseeker + cw B (id #2)
        [pathseekerWorkItemId, IDS[1]],
        // cw B (id #2) depends on pathseeker + cw A (id #1)
        [pathseekerWorkItemId, IDS[0]],
      ]);
    });
  });

  describe('cap-split forward-ref resolution', () => {
    it('VALID: {8 contract steps in one group, step #8 depends on step #1} => chunks of [6, 2]; chunk-2 codeweaver depends on chunk-1 codeweaver', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      // 2 codeweaver + ward + siege + 2 lawbringer + 5 minions + synthesizer + final ward = 13
      proxy.setupUuids({ uuids: IDS.slice(0, 13) });

      const step1Id = StepIdStub({ value: 'cap-step-1' });
      const step2Id = StepIdStub({ value: 'cap-step-2' });
      const step3Id = StepIdStub({ value: 'cap-step-3' });
      const step4Id = StepIdStub({ value: 'cap-step-4' });
      const step5Id = StepIdStub({ value: 'cap-step-5' });
      const step6Id = StepIdStub({ value: 'cap-step-6' });
      const step7Id = StepIdStub({ value: 'cap-step-7' });
      const step8Id = StepIdStub({ value: 'cap-step-8' });

      const step1 = DependencyStepStub({
        id: step1Id,
        dependsOn: [],
        focusFile: { path: 'src/contracts/c1/c1-contract.ts' },
      });
      const step2 = DependencyStepStub({
        id: step2Id,
        dependsOn: [],
        focusFile: { path: 'src/contracts/c2/c2-contract.ts' },
      });
      const step3 = DependencyStepStub({
        id: step3Id,
        dependsOn: [],
        focusFile: { path: 'src/contracts/c3/c3-contract.ts' },
      });
      const step4 = DependencyStepStub({
        id: step4Id,
        dependsOn: [],
        focusFile: { path: 'src/contracts/c4/c4-contract.ts' },
      });
      const step5 = DependencyStepStub({
        id: step5Id,
        dependsOn: [],
        focusFile: { path: 'src/contracts/c5/c5-contract.ts' },
      });
      const step6 = DependencyStepStub({
        id: step6Id,
        dependsOn: [],
        focusFile: { path: 'src/contracts/c6/c6-contract.ts' },
      });
      const step7 = DependencyStepStub({
        id: step7Id,
        dependsOn: [],
        focusFile: { path: 'src/contracts/c7/c7-contract.ts' },
      });
      // Step #8 forward-refs back to step #1 — they land in different cap-split chunks
      // (#1 in chunk-1 [steps 1-6], #8 in chunk-2 [steps 7-8]), so chunk-2's codeweaver
      // must list chunk-1's codeweaver id in dependsOn.
      const step8 = DependencyStepStub({
        id: step8Id,
        dependsOn: [step1Id],
        focusFile: { path: 'src/contracts/c8/c8-contract.ts' },
      });

      const flow = FlowStub({ id: FlowIdStub({ value: 'login-flow' }) });
      const pathseekerWorkItemId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
      });

      const result = stepsToWorkItemsTransformer({
        steps: [step1, step2, step3, step4, step5, step6, step7, step8],
        flows: [flow],
        pathseekerWorkItemId,
        now: NOW,
        batchGroups: FolderTypeGroupsStub({ value: [['contracts']] }),
      });

      const roles = result.map((wi) => wi.role);

      expect(roles).toStrictEqual([
        'codeweaver',
        'codeweaver',
        'ward',
        'siegemaster',
        'lawbringer',
        'lawbringer',
        'blightwarden-security-minion',
        'blightwarden-dedup-minion',
        'blightwarden-perf-minion',
        'blightwarden-integrity-minion',
        'blightwarden-dead-code-minion',
        'blightwarden',
        'ward',
      ]);

      const codeweaverDeps = result
        .filter((wi) => wi.role === 'codeweaver')
        .map((wi) => wi.dependsOn);

      expect(codeweaverDeps).toStrictEqual([
        // chunk-1 codeweaver (id #1) — no cross-chunk deps
        [pathseekerWorkItemId],
        // chunk-2 codeweaver (id #2) — step #8 forward-refs step #1 in chunk-1
        [pathseekerWorkItemId, IDS[0]],
      ]);
    });
  });
});
