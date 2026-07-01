import {
  DependencyStepStub,
  FlowIdStub,
  FlowStub,
  QuestWorkItemIdStub,
  StepFileReferenceStub,
  StepFocusActionStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import { IsoTimestampStub } from '../../contracts/iso-timestamp/iso-timestamp.stub';
import { stepsToWorkItemsTransformer } from './steps-to-work-items-transformer';
import { stepsToWorkItemsTransformerProxy } from './steps-to-work-items-transformer.proxy';

const NOW = IsoTimestampStub({ value: '2024-01-15T10:00:00.000Z' });

// Sequential UUIDs the proxy hands crypto.randomUUID() in order. Each test slices off as many ids
// as its full chain needs. Blightwarden is a single work item (it summons its minions as
// sub-agents itself), so the chain is one blightwarden item between the lawbringers and the final ward.
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

describe('stepsToWorkItemsTransformer', () => {
  describe('basic chain generation', () => {
    it('VALID: {1 step, 1 flow} => 1 codeweaver + 1 ward + 1 siege + 1 lawbringer + 1 blightwarden + 1 final-ward', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      proxy.setupUuids({ uuids: IDS.slice(0, 6) });

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
          maxAttempts: 3,
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
          role: 'blightwarden',
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
          role: 'ward',
          status: 'pending',
          spawnerType: 'command',
          relatedDataItems: [],
          dependsOn: [IDS[4]],
          maxAttempts: 3,
          attempt: 0,
          retryCount: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
          wardMode: 'full',
        },
      ]);
    });
  });

  describe('cyclic chunk merge (acyclic codeweaver graph)', () => {
    it('VALID: {package steps bracket a chain of solo focusAction steps} => codeweaver chunks merge into one acyclic item (no dependsOn cycle)', () => {
      // Reproduces the real-world cycle: a package-bucket step (update package.json) depends on a
      // no-focusFile sweep step (solo chunk), which transitively depends back on another
      // package-bucket step (modify widget). Per-package + solo chunking would put the two ends in
      // the same web chunk while the sweep steps land in solo chunks → web→solo→solo→web cycle.
      const proxy = stepsToWorkItemsTransformerProxy();
      proxy.setupUuids({ uuids: IDS });

      const modifyWidget = DependencyStepStub({
        id: StepIdStub({ value: 'aaaaaaaa-0000-4000-8000-000000000001' }),
        focusFile: StepFileReferenceStub({
          path: 'packages/web/src/widgets/quest-spec-panel/flows-layer-widget.tsx',
        }),
        dependsOn: [],
      });
      const deleteMermaid = DependencyStepStub({
        id: StepIdStub({ value: 'aaaaaaaa-0000-4000-8000-000000000002' }),
        focusFile: undefined,
        focusAction: StepFocusActionStub({
          kind: 'command',
          description: 'Delete the mermaid-diagram widget directory',
        }),
        dependsOn: [modifyWidget.id],
      });
      const deletePanzoom = DependencyStepStub({
        id: StepIdStub({ value: 'aaaaaaaa-0000-4000-8000-000000000003' }),
        focusFile: undefined,
        focusAction: StepFocusActionStub({
          kind: 'command',
          description: 'Delete the panzoom adapter directory',
        }),
        dependsOn: [deleteMermaid.id],
      });
      const updatePackageJson = DependencyStepStub({
        id: StepIdStub({ value: 'aaaaaaaa-0000-4000-8000-000000000004' }),
        focusFile: StepFileReferenceStub({ path: 'packages/web/package.json' }),
        dependsOn: [deletePanzoom.id],
      });

      const pathseekerWorkItemId = QuestWorkItemIdStub({
        value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
      });

      const result = stepsToWorkItemsTransformer({
        steps: [modifyWidget, deleteMermaid, deletePanzoom, updatePackageJson],
        flows: [],
        pathseekerWorkItemId,
        now: NOW,
      });

      const codeweavers = result.filter((wi) => wi.role === 'codeweaver');

      expect(codeweavers).toStrictEqual([
        {
          id: IDS[0],
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [
            `steps/${String(modifyWidget.id)}`,
            `steps/${String(updatePackageJson.id)}`,
            `steps/${String(deleteMermaid.id)}`,
            `steps/${String(deletePanzoom.id)}`,
          ],
          dependsOn: [pathseekerWorkItemId],
          maxAttempts: 1,
          attempt: 0,
          retryCount: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
      ]);
    });
  });

  describe('blightwarden wiring', () => {
    it('VALID: {1 step, 1 flow} => blightwarden depends on the lawbringer; final ward depends on blightwarden', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      proxy.setupUuids({ uuids: IDS.slice(0, 6) });

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

      // No minion work items — blightwarden summons them as sub-agents itself.
      expect(result.filter((wi) => wi.role.endsWith('-minion'))).toStrictEqual([]);

      const blightwarden = result.find((wi) => wi.role === 'blightwarden');
      const finalWard = result.filter((wi) => wi.role === 'ward').at(-1);

      // Blightwarden depends on the single lawbringer (id #4).
      expect(blightwarden?.dependsOn).toStrictEqual([IDS[3]]);
      // Final ward depends on the blightwarden only.
      expect(finalWard?.dependsOn).toStrictEqual([IDS[4]]);
      expect(finalWard?.wardMode).toBe('full');
    });

    it('VALID: {0 steps, 1 flow} => blightwarden depends on the siege item (no lawbringers exist)', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      proxy.setupUuids({ uuids: IDS.slice(0, 4) });

      const flow = FlowStub({ id: FlowIdStub({ value: 'login-flow' }) });
      const pathseekerWorkItemId = QuestWorkItemIdStub({
        value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
      });

      const result = stepsToWorkItemsTransformer({
        steps: [],
        flows: [flow],
        pathseekerWorkItemId,
        now: NOW,
      });

      // ward (#1) + siege (#2) + blightwarden (#3) + final ward (#4)
      const blightwarden = result.find((wi) => wi.role === 'blightwarden');

      expect(blightwarden?.dependsOn).toStrictEqual([IDS[1]]);
    });

    it('VALID: {1 step, 0 flows} => blightwarden depends on the lawbringer (no sieges exist)', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      proxy.setupUuids({ uuids: IDS.slice(0, 5) });

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

      // codeweaver (#1) + ward (#2) + lawbringer (#3) + blightwarden (#4) + final ward (#5)
      const blightwarden = result.find((wi) => wi.role === 'blightwarden');

      expect(blightwarden?.dependsOn).toStrictEqual([IDS[2]]);

      const finalWard = result.filter((wi) => wi.role === 'ward').at(-1);

      expect(finalWard?.dependsOn).toStrictEqual([IDS[3]]);
    });

    it('VALID: {0 steps, 0 flows} => blightwarden depends on the ward item (empty-flows edge)', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      proxy.setupUuids({ uuids: IDS.slice(0, 3) });

      const pathseekerWorkItemId = QuestWorkItemIdStub({
        value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
      });

      const result = stepsToWorkItemsTransformer({
        steps: [],
        flows: [],
        pathseekerWorkItemId,
        now: NOW,
      });

      // ward (#1) + blightwarden (#2) + final ward (#3)
      const blightwarden = result.find((wi) => wi.role === 'blightwarden');

      expect(blightwarden?.dependsOn).toStrictEqual([IDS[0]]);
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
    it('VALID: {1 step, 3 flows} => 3 siege items chained; lawbringer depends on all 3; blightwarden depends on lawbringer; final ward depends on blightwarden', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      proxy.setupUuids({ uuids: IDS.slice(0, 8) });

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

      // cw (#1) + ward (#2) + 3 sieges (#3-#5) + lawbringer (#6) + blightwarden (#7) + final ward (#8)
      const lawbringer = result.find((wi) => wi.role === 'lawbringer');

      expect(lawbringer?.dependsOn).toStrictEqual([IDS[2], IDS[3], IDS[4]]);

      const blightwarden = result.find((wi) => wi.role === 'blightwarden');

      expect(blightwarden?.dependsOn).toStrictEqual([IDS[5]]);

      const finalWard = result.filter((wi) => wi.role === 'ward').at(-1);

      expect(finalWard?.dependsOn).toStrictEqual([IDS[6]]);
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
      });

      const codeweaverDeps = result
        .filter((wi) => wi.role === 'codeweaver')
        .map((wi) => wi.dependsOn);

      expect(codeweaverDeps).toStrictEqual([[pathseekerWorkItemId]]);
    });

    it('VALID: {circular dep — A depends on B, B depends on A} => the cyclic chunks merge into one acyclic codeweaver', () => {
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
      });

      // Mutually-dependent chunks must run as one codeweaver; merging keeps the work-item graph acyclic.
      const codeweavers = result.filter((wi) => wi.role === 'codeweaver');

      expect(codeweavers).toStrictEqual([
        {
          id: IDS[0],
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [`steps/${String(stepAId)}`, `steps/${String(stepBId)}`],
          dependsOn: [pathseekerWorkItemId],
          maxAttempts: 1,
          attempt: 0,
          retryCount: 0,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
      ]);
    });
  });

  describe('cross-package forward-ref resolution', () => {
    it('VALID: {2 contract steps in different packages, step #2 depends on step #1} => one codeweaver per package; package-2 codeweaver depends on package-1 codeweaver', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      // 2 codeweaver + ward + siege + 2 lawbringer (one per package) + 1 blightwarden + final ward = 8
      proxy.setupUuids({ uuids: IDS.slice(0, 8) });

      const step1Id = StepIdStub({ value: 'pkg-step-1' });
      const step2Id = StepIdStub({ value: 'pkg-step-2' });

      const step1 = DependencyStepStub({
        id: step1Id,
        dependsOn: [],
        focusFile: { path: 'packages/web/src/contracts/c1/c1-contract.ts' },
      });
      // Step #2 lives in a different package and forward-refs step #1, so the package-2 codeweaver
      // chunk must list the package-1 codeweaver id in dependsOn.
      const step2 = DependencyStepStub({
        id: step2Id,
        dependsOn: [step1Id],
        focusFile: { path: 'packages/orchestrator/src/contracts/c2/c2-contract.ts' },
      });

      const flow = FlowStub({ id: FlowIdStub({ value: 'login-flow' }) });
      const pathseekerWorkItemId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
      });

      const result = stepsToWorkItemsTransformer({
        steps: [step1, step2],
        flows: [flow],
        pathseekerWorkItemId,
        now: NOW,
      });

      const roles = result.map((wi) => wi.role);

      // Lawbringer chunks by package (mirrors codeweaver), so two contracts in different packages
      // yield one lawbringer parent each.
      expect(roles).toStrictEqual([
        'codeweaver',
        'codeweaver',
        'ward',
        'siegemaster',
        'lawbringer',
        'lawbringer',
        'blightwarden',
        'ward',
      ]);

      const codeweaverDeps = result
        .filter((wi) => wi.role === 'codeweaver')
        .map((wi) => wi.dependsOn);

      expect(codeweaverDeps).toStrictEqual([
        // package-1 codeweaver (id #1) — no cross-chunk deps
        [pathseekerWorkItemId],
        // package-2 codeweaver (id #2) — step #2 forward-refs step #1 in package-1
        [pathseekerWorkItemId, IDS[0]],
      ]);
    });
  });

  describe('flowrider routing (flow/startup steps)', () => {
    it('VALID: {one broker step + one flows step + one flow} => flowrider owns the flows step; codeweaver excludes it; siege depends on flowrider', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      // 1 codeweaver + ward + 1 flowrider + 1 siege + 1 lawbringer (flow step excluded) + 1 blightwarden + ward = 7
      proxy.setupUuids({ uuids: IDS.slice(0, 13) });

      const brokerStepId = StepIdStub({ value: 'broker-step' });
      const flowStepId = StepIdStub({ value: 'flow-step' });

      const brokerStep = DependencyStepStub({
        id: brokerStepId,
        dependsOn: [],
        focusFile: { path: 'packages/web/src/brokers/a/a-broker.ts' },
      });
      const flowStep = DependencyStepStub({
        id: flowStepId,
        dependsOn: [],
        focusFile: { path: 'packages/web/src/flows/login/login-flow.ts' },
      });

      const flow = FlowStub({ id: FlowIdStub({ value: 'login-flow' }) });
      const pathseekerWorkItemId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
      });

      const result = stepsToWorkItemsTransformer({
        steps: [brokerStep, flowStep],
        flows: [flow],
        pathseekerWorkItemId,
        now: NOW,
      });

      // Codeweaver excludes the flows/ step — only the broker step remains.
      const codeweaverRelated = result
        .filter((wi) => wi.role === 'codeweaver')
        .map((wi) => wi.relatedDataItems);

      expect(codeweaverRelated).toStrictEqual([[`steps/${String(brokerStepId)}`]]);

      // Flowrider owns the flow plus the flow/startup step ref.
      const flowrider = result.find((wi) => wi.role === 'flowrider');

      expect(flowrider?.relatedDataItems).toStrictEqual([
        `flows/${String(flow.id)}`,
        `steps/${String(flowStepId)}`,
      ]);

      // Siege depends on the flowrider for its flow (not the changed-ward directly).
      const siege = result.find((wi) => wi.role === 'siegemaster');

      expect(siege?.dependsOn).toStrictEqual([flowrider?.id]);
    });

    it('VALID: {one broker step + one .e2e.ts step + one flow} => flowrider owns the e2e step; no codeweaver carries it', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      // 1 codeweaver + ward + 1 flowrider + 1 siege + 1 lawbringer (flow step excluded) + 1 blightwarden + ward = 7
      proxy.setupUuids({ uuids: IDS.slice(0, 13) });

      const brokerStepId = StepIdStub({ value: 'broker-step' });
      const e2eStepId = StepIdStub({ value: 'e2e-step' });

      const brokerStep = DependencyStepStub({
        id: brokerStepId,
        dependsOn: [],
        focusFile: { path: 'packages/web/src/brokers/a/a-broker.ts' },
      });
      const e2eStep = DependencyStepStub({
        id: e2eStepId,
        dependsOn: [],
        focusFile: { path: 'packages/web/src/flows/home/guild-delete.e2e.ts' },
      });

      const flow = FlowStub({ id: FlowIdStub({ value: 'login-flow' }) });
      const pathseekerWorkItemId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
      });

      const result = stepsToWorkItemsTransformer({
        steps: [brokerStep, e2eStep],
        flows: [flow],
        pathseekerWorkItemId,
        now: NOW,
      });

      const flowrider = result.find((wi) => wi.role === 'flowrider');

      expect(flowrider?.relatedDataItems).toStrictEqual([
        `flows/${String(flow.id)}`,
        `steps/${String(e2eStepId)}`,
      ]);

      const codeweaverRelated = result
        .filter((wi) => wi.role === 'codeweaver')
        .map((wi) => wi.relatedDataItems);

      // The e2e step lands on flowrider, never codeweaver — only the broker step remains.
      expect(codeweaverRelated).toStrictEqual([[`steps/${String(brokerStepId)}`]]);
    });

    it('VALID: {one broker step + one .integration.test.ts step + one flow} => flowrider owns the integration step; no codeweaver carries it', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      // 1 codeweaver + ward + 1 flowrider + 1 siege + 1 lawbringer (flow step excluded) + 1 blightwarden + ward = 7
      proxy.setupUuids({ uuids: IDS.slice(0, 13) });

      const brokerStepId = StepIdStub({ value: 'broker-step' });
      const integrationStepId = StepIdStub({ value: 'integration-step' });

      const brokerStep = DependencyStepStub({
        id: brokerStepId,
        dependsOn: [],
        focusFile: { path: 'packages/server/src/brokers/a/a-broker.ts' },
      });
      const integrationStep = DependencyStepStub({
        id: integrationStepId,
        dependsOn: [],
        focusFile: { path: 'packages/server/src/flows/quest/quest-flow.integration.test.ts' },
      });

      const flow = FlowStub({ id: FlowIdStub({ value: 'login-flow' }) });
      const pathseekerWorkItemId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
      });

      const result = stepsToWorkItemsTransformer({
        steps: [brokerStep, integrationStep],
        flows: [flow],
        pathseekerWorkItemId,
        now: NOW,
      });

      const flowrider = result.find((wi) => wi.role === 'flowrider');

      expect(flowrider?.relatedDataItems).toStrictEqual([
        `flows/${String(flow.id)}`,
        `steps/${String(integrationStepId)}`,
      ]);

      const codeweaverRelated = result
        .filter((wi) => wi.role === 'codeweaver')
        .map((wi) => wi.relatedDataItems);

      expect(codeweaverRelated).toStrictEqual([[`steps/${String(brokerStepId)}`]]);
    });

    it('VALID: {e2e-only quest — one .e2e.ts step, one flow, no flows/ or startup/ impl step} => flowrider summoned', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      // ward + 1 flowrider + 1 siege + 0 lawbringer (only step is flowrider-owned) + 1 blightwarden +
      // ward = 5 work items (no codeweaver — the only step is flowrider-owned). Provide spare ids.
      proxy.setupUuids({ uuids: IDS.slice(0, 11) });

      const e2eStepId = StepIdStub({ value: 'e2e-only-step' });
      const e2eStep = DependencyStepStub({
        id: e2eStepId,
        dependsOn: [],
        focusFile: { path: 'packages/web/src/flows/home/guild-delete.e2e.ts' },
      });

      const flow = FlowStub({ id: FlowIdStub({ value: 'login-flow' }) });
      const pathseekerWorkItemId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
      });

      const result = stepsToWorkItemsTransformer({
        steps: [e2eStep],
        flows: [flow],
        pathseekerWorkItemId,
        now: NOW,
      });

      const flowrider = result.find((wi) => wi.role === 'flowrider');

      expect(flowrider?.relatedDataItems).toStrictEqual([
        `flows/${String(flow.id)}`,
        `steps/${String(e2eStepId)}`,
      ]);

      // No codeweaver item — the only step is flowrider-owned.
      const codeweaverRoles = result.filter((wi) => wi.role === 'codeweaver').map((wi) => wi.role);

      expect(codeweaverRoles).toStrictEqual([]);
    });

    it('VALID: {no flow/startup steps} => no flowrider items; siege depends on the changed-ward', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      // 1 codeweaver + ward + 1 siege + 1 lawbringer + 1 blightwarden + ward = 6
      proxy.setupUuids({ uuids: IDS.slice(0, 11) });

      const brokerStep = DependencyStepStub({
        id: StepIdStub({ value: 'broker-only' }),
        dependsOn: [],
        focusFile: { path: 'packages/web/src/brokers/a/a-broker.ts' },
      });
      const flow = FlowStub({ id: FlowIdStub({ value: 'login-flow' }) });

      const result = stepsToWorkItemsTransformer({
        steps: [brokerStep],
        flows: [flow],
        pathseekerWorkItemId: QuestWorkItemIdStub({
          value: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
        }),
        now: NOW,
      });

      const flowriderRoles = result.filter((wi) => wi.role === 'flowrider').map((wi) => wi.role);

      expect(flowriderRoles).toStrictEqual([]);

      const ward = result.find((wi) => wi.role === 'ward');
      const siege = result.find((wi) => wi.role === 'siegemaster');

      expect(siege?.dependsOn).toStrictEqual([ward?.id]);
    });
  });

  describe('lawbringer package chunking + reviewable filter', () => {
    it('VALID: {web impl steps across contracts/adapters/widgets + command/package.json/e2e steps} => one web lawbringer over only the reviewable impl pairs', () => {
      const proxy = stepsToWorkItemsTransformerProxy();
      proxy.setupUuids({ uuids: IDS });

      const contractStep = DependencyStepStub({
        id: StepIdStub({ value: 'web-observable-count-contract' }),
        dependsOn: [],
        focusFile: {
          path: 'packages/web/src/contracts/observable-count/observable-count-contract.ts',
        },
      });
      const adapterStep = DependencyStepStub({
        id: StepIdStub({ value: 'web-elk-layout-adapter' }),
        dependsOn: [],
        focusFile: { path: 'packages/web/src/adapters/elk/layout/elk-layout-adapter.ts' },
      });
      const widgetStep = DependencyStepStub({
        id: StepIdStub({ value: 'web-react-flow-diagram-widget' }),
        dependsOn: [],
        focusFile: {
          path: 'packages/web/src/widgets/react-flow-diagram/react-flow-diagram-widget.tsx',
        },
      });
      // Operational step: a command instruction whose text embeds a src/ path — not a reviewable pair.
      const deleteStep = DependencyStepStub({
        id: StepIdStub({ value: 'web-delete-mermaid-widget' }),
        focusFile: undefined,
        focusAction: StepFocusActionStub({
          kind: 'command',
          description: 'Delete packages/web/src/widgets/mermaid-diagram/ and all its files',
        }),
        dependsOn: [],
      });
      // package.json edit: resolves to no folder type — not a reviewable pair.
      const packageJsonStep = DependencyStepStub({
        id: StepIdStub({ value: 'web-update-package-json' }),
        dependsOn: [],
        focusFile: { path: 'packages/web/package.json' },
      });
      // e2e step: resolves to flows/ but is flowrider-owned — excluded by the package chunker.
      const e2eStep = DependencyStepStub({
        id: StepIdStub({ value: 'web-e2e-diagram' }),
        dependsOn: [],
        focusFile: { path: 'packages/web/src/flows/quest-chat/quest-spec-panel-diagram.e2e.ts' },
      });

      const flow = FlowStub({ id: FlowIdStub({ value: 'review-flows-diagram' }) });
      const pathseekerWorkItemId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
      });

      const result = stepsToWorkItemsTransformer({
        steps: [contractStep, adapterStep, widgetStep, deleteStep, packageJsonStep, e2eStep],
        flows: [flow],
        pathseekerWorkItemId,
        now: NOW,
      });

      const lawbringers = result.filter((wi) => wi.role === 'lawbringer');

      // One web lawbringer parent, carrying only the three reviewable impl pairs (command +
      // package.json dropped by the reviewable filter; e2e dropped as flowrider-owned).
      expect(lawbringers.map((wi) => wi.relatedDataItems)).toStrictEqual([
        [
          `steps/${String(contractStep.id)}`,
          `steps/${String(adapterStep.id)}`,
          `steps/${String(widgetStep.id)}`,
        ],
      ]);
    });
  });
});
