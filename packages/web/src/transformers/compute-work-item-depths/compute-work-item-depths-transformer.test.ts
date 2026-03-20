import { WorkItemStub } from '@dungeonmaster/shared/contracts';

import { computeWorkItemDepthsTransformer } from './compute-work-item-depths-transformer';

type WorkItem = ReturnType<typeof WorkItemStub>;

describe('computeWorkItemDepthsTransformer', () => {
  describe('linear chain', () => {
    it('VALID: {A→B→C linear chain} => depths 0, 1, 2', () => {
      const a = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'pathseeker',
        status: 'complete',
        dependsOn: [],
      });
      const b = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [a.id],
      });
      const c = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000003',
        role: 'ward',
        status: 'pending',
        dependsOn: [b.id],
      });

      const items = [a, b, c];
      const itemMap = new Map<WorkItem['id'], WorkItem>(items.map((i) => [i.id, i]));
      const result = computeWorkItemDepthsTransformer({ items, itemMap });

      expect(result.get(a.id)).toBe(0);
      expect(result.get(b.id)).toBe(1);
      expect(result.get(c.id)).toBe(2);
    });
  });

  describe('no dependencies', () => {
    it('VALID: {items with no deps} => all depth 0', () => {
      const a = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [],
      });
      const b = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [],
      });

      const items = [a, b];
      const itemMap = new Map<WorkItem['id'], WorkItem>(items.map((i) => [i.id, i]));
      const result = computeWorkItemDepthsTransformer({ items, itemMap });

      expect(result.get(a.id)).toBe(0);
      expect(result.get(b.id)).toBe(0);
    });
  });

  describe('deps outside filtered set', () => {
    it('EDGE: {item depends on ID not in itemMap} => depth 0', () => {
      const a = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'codeweaver',
        status: 'pending',
        dependsOn: ['b0000000-0000-0000-0000-999999999999'],
      });

      const items = [a];
      const itemMap = new Map<WorkItem['id'], WorkItem>(items.map((i) => [i.id, i]));
      const result = computeWorkItemDepthsTransformer({ items, itemMap });

      expect(result.get(a.id)).toBe(0);
    });
  });

  describe('diamond dependency', () => {
    it('VALID: {A→B, A→C, B→D, C→D diamond} => D has depth 2', () => {
      const a = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'pathseeker',
        status: 'complete',
        dependsOn: [],
      });
      const b = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [a.id],
      });
      const c = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000003',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [a.id],
      });
      const d = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000004',
        role: 'ward',
        status: 'pending',
        dependsOn: [b.id, c.id],
      });

      const items = [a, b, c, d];
      const itemMap = new Map<WorkItem['id'], WorkItem>(items.map((i) => [i.id, i]));
      const result = computeWorkItemDepthsTransformer({ items, itemMap });

      expect(result.get(a.id)).toBe(0);
      expect(result.get(b.id)).toBe(1);
      expect(result.get(c.id)).toBe(1);
      expect(result.get(d.id)).toBe(2);
    });
  });
});
