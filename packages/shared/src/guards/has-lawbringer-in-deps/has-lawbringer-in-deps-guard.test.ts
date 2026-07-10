import { WorkItemStub } from '@dungeonmaster/shared/contracts';

import { hasLawbringerInDepsGuard } from './has-lawbringer-in-deps-guard';

type WorkItem = ReturnType<typeof WorkItemStub>;

describe('hasLawbringerInDepsGuard', () => {
  describe('lawbringer present', () => {
    it('VALID: {direct lawbringer dep} => returns true', () => {
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

      const allItemMap = new Map<WorkItem['id'], WorkItem>([
        [lb.id, lb],
        [ward.id, ward],
      ]);

      expect(hasLawbringerInDepsGuard({ startItem: ward, allItemMap })).toBe(true);
    });

    it('VALID: {transitive lawbringer dep via siege} => returns true', () => {
      const lb = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'lawbringer',
        status: 'complete',
        dependsOn: [],
      });
      const siege = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'siegemaster',
        status: 'complete',
        dependsOn: [lb.id],
      });
      const ward = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000003',
        role: 'ward',
        status: 'pending',
        dependsOn: [siege.id],
      });

      const allItemMap = new Map<WorkItem['id'], WorkItem>([
        [lb.id, lb],
        [siege.id, siege],
        [ward.id, ward],
      ]);

      expect(hasLawbringerInDepsGuard({ startItem: ward, allItemMap })).toBe(true);
    });
  });

  describe('no lawbringer', () => {
    it('VALID: {only codeweaver deps} => returns false', () => {
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

      const allItemMap = new Map<WorkItem['id'], WorkItem>([
        [cw.id, cw],
        [ward.id, ward],
      ]);

      expect(hasLawbringerInDepsGuard({ startItem: ward, allItemMap })).toBe(false);
    });
  });

  describe('empty params', () => {
    it('EMPTY: {no startItem} => returns false', () => {
      expect(hasLawbringerInDepsGuard({})).toBe(false);
    });
  });
});
