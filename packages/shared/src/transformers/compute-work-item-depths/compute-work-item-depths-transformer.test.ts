import { WorkItemStub } from '../../contracts/work-item/work-item.stub';

import { computeWorkItemDepthsTransformer } from './compute-work-item-depths-transformer';

type WorkItem = ReturnType<typeof WorkItemStub>;

describe('computeWorkItemDepthsTransformer', () => {
  describe('linear chain', () => {
    it('VALID: {A→B→C linear chain} => depths 0, 1, 2', () => {
      const a = WorkItemStub({
        id: '235be74a-c2e6-687c-a91c-7169625c0e54',
        role: 'chaoswhisperer',
        status: 'complete',
        dependsOn: [],
      });
      const b = WorkItemStub({
        id: '7d42a5b3-83e0-4dd4-b874-900390937194',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [a.id],
      });
      const c = WorkItemStub({
        id: '0c478f2e-447c-8816-a9f9-24a2987ea557',
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
        id: '235be74a-c2e6-687c-a91c-7169625c0e54',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [],
      });
      const b = WorkItemStub({
        id: '7d42a5b3-83e0-4dd4-b874-900390937194',
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
        id: '235be74a-c2e6-687c-a91c-7169625c0e54',
        role: 'codeweaver',
        status: 'pending',
        dependsOn: ['d11dfd4a-2d77-109b-91c4-cf61f1c5a934'],
      });

      const items = [a];
      const itemMap = new Map<WorkItem['id'], WorkItem>(items.map((i) => [i.id, i]));
      const result = computeWorkItemDepthsTransformer({ items, itemMap });

      expect(result.get(a.id)).toBe(0);
    });
  });

  describe('dependency cycle (cycle-breaking longest path)', () => {
    it('EDGE: {3-item cycle + downstream + tail} => cycle resolves to finite depths and downstream sorts after the cycle', () => {
      // root → {x,y,z mutually cyclic} → downstream → tail. A naive Kahn topo-sort never dequeues the
      // cycle members, so it collapses downstream + tail to depth 0 (they sort ABOVE the cycle).
      // Cycle-breaking longest-path skips back-edges, so every node gets a finite depth and the
      // downstream chain stays below the cycle.
      const root = WorkItemStub({
        id: '235be74a-c2e6-687c-a91c-7169625c0e54',
        role: 'chaoswhisperer',
        status: 'complete',
        dependsOn: [],
      });
      const x = WorkItemStub({
        id: '7d42a5b3-83e0-4dd4-b874-900390937194',
        role: 'codeweaver',
        status: 'pending',
        dependsOn: [root.id, '04505e0a-98ac-385a-9f80-a7e573adb589'],
      });
      const y = WorkItemStub({
        id: '0c478f2e-447c-8816-a9f9-24a2987ea557',
        role: 'codeweaver',
        status: 'pending',
        dependsOn: [root.id, x.id],
      });
      const z = WorkItemStub({
        id: '04505e0a-98ac-385a-9f80-a7e573adb589',
        role: 'codeweaver',
        status: 'pending',
        dependsOn: [root.id, y.id],
      });
      const downstream = WorkItemStub({
        id: '086a7fe7-7bb1-4312-8857-8da2fd202117',
        role: 'ward',
        status: 'pending',
        dependsOn: [x.id, y.id, z.id],
      });
      const tail = WorkItemStub({
        id: '1291c5a5-b6da-6f31-aa5c-0976ed51b98e',
        role: 'flowrider',
        status: 'pending',
        dependsOn: [downstream.id],
      });

      const items = [root, x, y, z, downstream, tail];
      const itemMap = new Map<WorkItem['id'], WorkItem>(items.map((i) => [i.id, i]));
      const result = computeWorkItemDepthsTransformer({ items, itemMap });

      expect(result).toStrictEqual(
        new Map([
          [root.id, 0],
          [x.id, 3],
          [y.id, 1],
          [z.id, 2],
          [downstream.id, 4],
          [tail.id, 5],
        ]),
      );
    });

    it('EDGE: {2-item cycle with no other deps} => resolves to finite depths (no infinite recursion)', () => {
      const p = WorkItemStub({
        id: '235be74a-c2e6-687c-a91c-7169625c0e54',
        role: 'codeweaver',
        status: 'pending',
        dependsOn: ['7d42a5b3-83e0-4dd4-b874-900390937194'],
      });
      const qItem = WorkItemStub({
        id: '7d42a5b3-83e0-4dd4-b874-900390937194',
        role: 'codeweaver',
        status: 'pending',
        dependsOn: [p.id],
      });

      const items = [p, qItem];
      const itemMap = new Map<WorkItem['id'], WorkItem>(items.map((i) => [i.id, i]));
      const result = computeWorkItemDepthsTransformer({ items, itemMap });

      expect(result.get(p.id)).toBe(1);
      expect(result.get(qItem.id)).toBe(0);
    });
  });

  describe('diamond dependency', () => {
    it('VALID: {A→B, A→C, B→D, C→D diamond} => D has depth 2', () => {
      const a = WorkItemStub({
        id: '235be74a-c2e6-687c-a91c-7169625c0e54',
        role: 'chaoswhisperer',
        status: 'complete',
        dependsOn: [],
      });
      const b = WorkItemStub({
        id: '7d42a5b3-83e0-4dd4-b874-900390937194',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [a.id],
      });
      const c = WorkItemStub({
        id: '0c478f2e-447c-8816-a9f9-24a2987ea557',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [a.id],
      });
      const d = WorkItemStub({
        id: '04505e0a-98ac-385a-9f80-a7e573adb589',
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
