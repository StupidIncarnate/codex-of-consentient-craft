import { QuestWorkItemIdStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { workItemsSkipRolesTransformer } from './work-items-skip-roles-transformer';

const ID_A = QuestWorkItemIdStub({ value: '00000000-0000-4000-8000-00000000000a' });
const ID_B = QuestWorkItemIdStub({ value: '00000000-0000-4000-8000-00000000000b' });
const ID_C = QuestWorkItemIdStub({ value: '00000000-0000-4000-8000-00000000000c' });
const ID_D = QuestWorkItemIdStub({ value: '00000000-0000-4000-8000-00000000000d' });

describe('workItemsSkipRolesTransformer', () => {
  describe('empty inputs', () => {
    it('EMPTY: {workItems: []} => returns empty array', () => {
      const result = workItemsSkipRolesTransformer({
        workItems: [],
        skipRoles: ['ward'],
      });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {skipRoles: []} => returns workItems unchanged', () => {
      const workItems = [
        WorkItemStub({ id: ID_A, role: 'codeweaver' }),
        WorkItemStub({ id: ID_B, role: 'ward', dependsOn: [ID_A] }),
      ];

      const result = workItemsSkipRolesTransformer({
        workItems,
        skipRoles: [],
      });

      expect(result).toStrictEqual(workItems);
    });

    it('EMPTY: {skipRoles does not match any item} => returns workItems unchanged-shape', () => {
      const workItems = [
        WorkItemStub({ id: ID_A, role: 'codeweaver', dependsOn: [] }),
        WorkItemStub({ id: ID_B, role: 'lawbringer', dependsOn: [ID_A] }),
      ];

      const result = workItemsSkipRolesTransformer({
        workItems,
        skipRoles: ['ward'],
      });

      expect(result).toStrictEqual([
        { ...workItems[0], dependsOn: [] },
        { ...workItems[1], dependsOn: [ID_A] },
      ]);
    });
  });

  describe('single-skip rewiring', () => {
    it('VALID: {skip ward item with one predecessor} => downstream dep points to predecessor', () => {
      const codeweaver = WorkItemStub({ id: ID_A, role: 'codeweaver', dependsOn: [] });
      const ward = WorkItemStub({ id: ID_B, role: 'ward', dependsOn: [ID_A] });
      const siege = WorkItemStub({ id: ID_C, role: 'siegemaster', dependsOn: [ID_B] });

      const result = workItemsSkipRolesTransformer({
        workItems: [codeweaver, ward, siege],
        skipRoles: ['ward'],
      });

      expect(result).toStrictEqual([
        { ...codeweaver, dependsOn: [] },
        { ...siege, dependsOn: [ID_A] },
      ]);
    });

    it('VALID: {skip ward item with multiple predecessors} => downstream gets all predecessors', () => {
      const cw1 = WorkItemStub({ id: ID_A, role: 'codeweaver', dependsOn: [] });
      const cw2 = WorkItemStub({ id: ID_B, role: 'codeweaver', dependsOn: [] });
      const ward = WorkItemStub({ id: ID_C, role: 'ward', dependsOn: [ID_A, ID_B] });
      const siege = WorkItemStub({ id: ID_D, role: 'siegemaster', dependsOn: [ID_C] });

      const result = workItemsSkipRolesTransformer({
        workItems: [cw1, cw2, ward, siege],
        skipRoles: ['ward'],
      });

      expect(result).toStrictEqual([
        { ...cw1, dependsOn: [] },
        { ...cw2, dependsOn: [] },
        { ...siege, dependsOn: [ID_A, ID_B] },
      ]);
    });

    it('VALID: {skip ward item with no predecessors} => downstream gets empty dependsOn', () => {
      const ward = WorkItemStub({ id: ID_A, role: 'ward', dependsOn: [] });
      const siege = WorkItemStub({ id: ID_B, role: 'siegemaster', dependsOn: [ID_A] });

      const result = workItemsSkipRolesTransformer({
        workItems: [ward, siege],
        skipRoles: ['ward'],
      });

      expect(result).toStrictEqual([{ ...siege, dependsOn: [] }]);
    });
  });

  describe('transitive rewiring', () => {
    it('VALID: {skip two chained items: ward then blightwarden} => downstream gets root predecessor', () => {
      const codeweaver = WorkItemStub({ id: ID_A, role: 'codeweaver', dependsOn: [] });
      const ward = WorkItemStub({ id: ID_B, role: 'ward', dependsOn: [ID_A] });
      const blight = WorkItemStub({ id: ID_C, role: 'blightwarden', dependsOn: [ID_B] });
      const finalItem = WorkItemStub({ id: ID_D, role: 'siegemaster', dependsOn: [ID_C] });

      const result = workItemsSkipRolesTransformer({
        workItems: [codeweaver, ward, blight, finalItem],
        skipRoles: ['ward', 'blightwarden'],
      });

      expect(result).toStrictEqual([
        { ...codeweaver, dependsOn: [] },
        { ...finalItem, dependsOn: [ID_A] },
      ]);
    });

    it('VALID: {downstream has mixed skipped + live deps} => dedups and keeps live deps alongside rewired', () => {
      const cw = WorkItemStub({ id: ID_A, role: 'codeweaver', dependsOn: [] });
      const ward = WorkItemStub({ id: ID_B, role: 'ward', dependsOn: [ID_A] });
      const siege = WorkItemStub({ id: ID_C, role: 'siegemaster', dependsOn: [ID_A, ID_B] });

      const result = workItemsSkipRolesTransformer({
        workItems: [cw, ward, siege],
        skipRoles: ['ward'],
      });

      expect(result).toStrictEqual([
        { ...cw, dependsOn: [] },
        { ...siege, dependsOn: [ID_A] },
      ]);
    });
  });

  describe('terminal skip', () => {
    it('VALID: {skip the last item, nothing depends on it} => that item is simply dropped', () => {
      const codeweaver = WorkItemStub({ id: ID_A, role: 'codeweaver', dependsOn: [] });
      const ward = WorkItemStub({ id: ID_B, role: 'ward', dependsOn: [ID_A] });

      const result = workItemsSkipRolesTransformer({
        workItems: [codeweaver, ward],
        skipRoles: ['ward'],
      });

      expect(result).toStrictEqual([{ ...codeweaver, dependsOn: [] }]);
    });
  });
});
