import { WorkItemStub } from '@dungeonmaster/shared/contracts';

import { resolveWardFloorNameTransformer } from './resolve-ward-floor-name-transformer';

describe('resolveWardFloorNameTransformer', () => {
  describe('mini boss', () => {
    it('VALID: {ward depends on codeweaver} => returns MINI BOSS', () => {
      const cw = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [],
      });
      const ward = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'ward',
        status: 'pending',
        dependsOn: [cw.id],
      });

      const result = resolveWardFloorNameTransformer({
        workItem: ward,
        allWorkItems: [cw, ward],
      });

      expect(result).toBe('MINI BOSS');
    });
  });

  describe('floor boss', () => {
    it('VALID: {ward depends on lawbringer} => returns FLOOR BOSS', () => {
      const lb = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'lawbringer',
        status: 'complete',
        dependsOn: [],
      });
      const ward = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'ward',
        status: 'pending',
        dependsOn: [lb.id],
      });

      const result = resolveWardFloorNameTransformer({
        workItem: ward,
        allWorkItems: [lb, ward],
      });

      expect(result).toBe('FLOOR BOSS');
    });
  });

  describe('retry chain', () => {
    it('VALID: {ward retry via insertedBy chain, root has codeweaver deps} => MINI BOSS', () => {
      const cw = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [],
      });
      const ward1 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'ward',
        status: 'failed',
        dependsOn: [cw.id],
      });
      const spirit = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000003',
        role: 'spiritmender',
        status: 'complete',
        dependsOn: [ward1.id],
      });
      const ward2 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000004',
        role: 'ward',
        status: 'pending',
        dependsOn: [spirit.id],
        insertedBy: ward1.id,
      });

      const result = resolveWardFloorNameTransformer({
        workItem: ward2,
        allWorkItems: [cw, ward1, spirit, ward2],
      });

      expect(result).toBe('MINI BOSS');
    });
  });
});
