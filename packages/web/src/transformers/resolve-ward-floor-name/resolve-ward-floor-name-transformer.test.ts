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

      const allItemMap = new Map([cw, ward].map((wi) => [wi.id, wi]));
      const result = resolveWardFloorNameTransformer({ workItem: ward, allItemMap });

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

      const allItemMap = new Map([lb, ward].map((wi) => [wi.id, wi]));
      const result = resolveWardFloorNameTransformer({ workItem: ward, allItemMap });

      expect(result).toBe('FLOOR BOSS');
    });
  });

  describe('wardMode', () => {
    it('VALID: {ward wardMode full, no lawbringer dep} => returns FLOOR BOSS', () => {
      const ward = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'ward',
        status: 'pending',
        wardMode: 'full',
        dependsOn: [],
      });

      const allItemMap = new Map([ward].map((wi) => [wi.id, wi]));
      const result = resolveWardFloorNameTransformer({ workItem: ward, allItemMap });

      expect(result).toBe('FLOOR BOSS');
    });

    it('VALID: {ward wardMode changed, lawbringer dep present} => returns MINI BOSS (wardMode wins over deps)', () => {
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
        wardMode: 'changed',
        dependsOn: [lb.id],
      });

      const allItemMap = new Map([lb, ward].map((wi) => [wi.id, wi]));
      const result = resolveWardFloorNameTransformer({ workItem: ward, allItemMap });

      expect(result).toBe('MINI BOSS');
    });

    it('VALID: {ward retry inherits root wardMode full via insertedBy chain} => FLOOR BOSS', () => {
      const ward1 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'ward',
        status: 'failed',
        wardMode: 'full',
        dependsOn: [],
      });
      const spirit = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'spiritmender',
        status: 'complete',
        dependsOn: [ward1.id],
      });
      const ward2 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000003',
        role: 'ward',
        status: 'pending',
        dependsOn: [spirit.id],
        insertedBy: ward1.id,
      });

      const allItemMap = new Map([ward1, spirit, ward2].map((wi) => [wi.id, wi]));
      const result = resolveWardFloorNameTransformer({ workItem: ward2, allItemMap });

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

      const allItemMap = new Map([cw, ward1, spirit, ward2].map((wi) => [wi.id, wi]));
      const result = resolveWardFloorNameTransformer({ workItem: ward2, allItemMap });

      expect(result).toBe('MINI BOSS');
    });
  });
});
