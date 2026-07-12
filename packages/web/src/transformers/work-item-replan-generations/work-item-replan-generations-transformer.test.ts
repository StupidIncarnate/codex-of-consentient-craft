import { QuestWorkItemIdStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { workItemReplanGenerationsTransformer } from './work-item-replan-generations-transformer';

const wid = (value: string): ReturnType<typeof QuestWorkItemIdStub> =>
  QuestWorkItemIdStub({ value });

describe('workItemReplanGenerationsTransformer', () => {
  it('EMPTY: {[]} => empty map', () => {
    const result = workItemReplanGenerationsTransformer({ workItems: [] });

    expect(result.size).toBe(0);
  });

  it('VALID: {no replan pathseeker} => every item is generation 0', () => {
    const chaosId = wid('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c50');
    const pathId = wid('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c51');
    const cwId = wid('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c52');
    const wardId = wid('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c53');
    const items = [
      WorkItemStub({ id: chaosId, role: 'chaoswhisperer', status: 'complete' }),
      WorkItemStub({ id: pathId, role: 'pathseeker', status: 'complete', dependsOn: [chaosId] }),
      WorkItemStub({ id: cwId, role: 'codeweaver', status: 'complete', dependsOn: [pathId] }),
      WorkItemStub({ id: wardId, role: 'ward', status: 'pending', dependsOn: [cwId] }),
    ];

    const result = workItemReplanGenerationsTransformer({ workItems: items });

    expect({
      chaos: Number(result.get(chaosId)),
      path: Number(result.get(pathId)),
      cw: Number(result.get(cwId)),
      ward: Number(result.get(wardId)),
    }).toStrictEqual({ chaos: 0, path: 0, cw: 0, ward: 0 });
  });

  it('VALID: {blightwarden failed + replan pathseeker + regenerated cw/ward} => original wave gen 0, replan wave gen 1', () => {
    const blightId = wid('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c60');
    const replanId = wid('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c61');
    const cw2Id = wid('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c62');
    const ward2Id = wid('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c63');
    const items = [
      WorkItemStub({ id: blightId, role: 'blightwarden', status: 'failed' }),
      WorkItemStub({
        id: replanId,
        role: 'pathseeker',
        status: 'pending',
        dependsOn: [],
        insertedBy: blightId,
      }),
      WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'pending', dependsOn: [replanId] }),
      WorkItemStub({ id: ward2Id, role: 'ward', status: 'pending', dependsOn: [cw2Id] }),
    ];

    const result = workItemReplanGenerationsTransformer({ workItems: items });

    expect({
      blight: Number(result.get(blightId)),
      replan: Number(result.get(replanId)),
      cw2: Number(result.get(cw2Id)),
      ward2: Number(result.get(ward2Id)),
    }).toStrictEqual({ blight: 0, replan: 1, cw2: 1, ward2: 1 });
  });

  it('VALID: {second replan} => three tiers 0 / 1 / 2 ranked by createdAt', () => {
    const blight1Id = wid('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c70');
    const replan1Id = wid('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c71');
    const blight2Id = wid('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c72');
    const replan2Id = wid('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c73');
    const cw3Id = wid('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c74');
    const items = [
      WorkItemStub({ id: blight1Id, role: 'blightwarden', status: 'failed' }),
      WorkItemStub({
        id: replan1Id,
        role: 'pathseeker',
        status: 'complete',
        dependsOn: [],
        insertedBy: blight1Id,
        createdAt: '2024-01-15T10:00:00.000Z',
      }),
      WorkItemStub({
        id: blight2Id,
        role: 'blightwarden',
        status: 'failed',
        dependsOn: [replan1Id],
      }),
      WorkItemStub({
        id: replan2Id,
        role: 'pathseeker',
        status: 'pending',
        dependsOn: [],
        insertedBy: blight2Id,
        createdAt: '2024-01-15T11:00:00.000Z',
      }),
      WorkItemStub({ id: cw3Id, role: 'codeweaver', status: 'pending', dependsOn: [replan2Id] }),
    ];

    const result = workItemReplanGenerationsTransformer({ workItems: items });

    expect({
      blight1: Number(result.get(blight1Id)),
      replan1: Number(result.get(replan1Id)),
      blight2: Number(result.get(blight2Id)),
      replan2: Number(result.get(replan2Id)),
      cw3: Number(result.get(cw3Id)),
    }).toStrictEqual({ blight1: 0, replan1: 1, blight2: 1, replan2: 2, cw3: 2 });
  });

  it('EDGE: {codeweaver cycle inside a replan wave} => both cycle members share the wave generation', () => {
    const blightId = wid('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c80');
    const replanId = wid('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c81');
    const cwAId = wid('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c82');
    const cwBId = wid('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c83');
    const items = [
      WorkItemStub({ id: blightId, role: 'blightwarden', status: 'failed' }),
      WorkItemStub({
        id: replanId,
        role: 'pathseeker',
        status: 'complete',
        dependsOn: [],
        insertedBy: blightId,
      }),
      WorkItemStub({
        id: cwAId,
        role: 'codeweaver',
        status: 'pending',
        dependsOn: [replanId, cwBId],
      }),
      WorkItemStub({
        id: cwBId,
        role: 'codeweaver',
        status: 'pending',
        dependsOn: [replanId, cwAId],
      }),
    ];

    const result = workItemReplanGenerationsTransformer({ workItems: items });

    expect({
      cwA: Number(result.get(cwAId)),
      cwB: Number(result.get(cwBId)),
    }).toStrictEqual({ cwA: 1, cwB: 1 });
  });

  it('EDGE: {bare pathseeker inserted by a non-failed parent} => generation 0 (not a boundary)', () => {
    const parentId = wid('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c90');
    const pathId = wid('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c91');
    const items = [
      WorkItemStub({ id: parentId, role: 'chaoswhisperer', status: 'complete' }),
      WorkItemStub({
        id: pathId,
        role: 'pathseeker',
        status: 'pending',
        insertedBy: parentId,
      }),
    ];

    const result = workItemReplanGenerationsTransformer({ workItems: items });

    expect(Number(result.get(pathId))).toBe(0);
  });
});
