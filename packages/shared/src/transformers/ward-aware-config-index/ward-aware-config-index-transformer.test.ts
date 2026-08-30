import { WorkItemStub } from '@dungeonmaster/shared/contracts';

import { wardAwareConfigIndexTransformer } from './ward-aware-config-index-transformer';

describe('wardAwareConfigIndexTransformer', () => {
  describe('ward work items', () => {
    it('VALID: {role: ward, wardMode: full} => returns 8 (FLOOR BOSS)', () => {
      const workItem = WorkItemStub({ role: 'ward', wardMode: 'full', dependsOn: [] });
      const allItemMap = new Map([[workItem.id, workItem]]);

      const result = wardAwareConfigIndexTransformer({ workItem, allItemMap });

      expect(result).toBe(8);
    });

    it('VALID: {role: ward, wardMode: changed} => returns 4 (MINI BOSS)', () => {
      const workItem = WorkItemStub({ role: 'ward', wardMode: 'changed', dependsOn: [] });
      const allItemMap = new Map([[workItem.id, workItem]]);

      const result = wardAwareConfigIndexTransformer({ workItem, allItemMap });

      expect(result).toBe(4);
    });
  });

  describe('non-ward work items', () => {
    it('VALID: {role: codeweaver} => returns 3 (FORGE)', () => {
      const workItem = WorkItemStub({ role: 'codeweaver' });
      const allItemMap = new Map([[workItem.id, workItem]]);

      const result = wardAwareConfigIndexTransformer({ workItem, allItemMap });

      expect(result).toBe(3);
    });

    it('VALID: {role: flowrider} => returns 6 (GLUEWORKS)', () => {
      const workItem = WorkItemStub({ role: 'flowrider' });
      const allItemMap = new Map([[workItem.id, workItem]]);

      const result = wardAwareConfigIndexTransformer({ workItem, allItemMap });

      expect(result).toBe(6);
    });

    it('VALID: {role: siegemaster} => returns 7 (ARENA, straight after GLUEWORKS)', () => {
      const workItem = WorkItemStub({ role: 'siegemaster' });
      const allItemMap = new Map([[workItem.id, workItem]]);

      const result = wardAwareConfigIndexTransformer({ workItem, allItemMap });

      expect(result).toBe(7);
    });

    it('VALID: {role: bughunt} => returns 2 (HOMEBASE entrance, like the other intake roles)', () => {
      const workItem = WorkItemStub({ role: 'bughunt' });
      const allItemMap = new Map([[workItem.id, workItem]]);

      const result = wardAwareConfigIndexTransformer({ workItem, allItemMap });

      expect(result).toBe(2);
    });
  });
});
