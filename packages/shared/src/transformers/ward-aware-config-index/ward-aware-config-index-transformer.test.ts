import { WorkItemStub } from '@dungeonmaster/shared/contracts';

import { wardAwareConfigIndexTransformer } from './ward-aware-config-index-transformer';

describe('wardAwareConfigIndexTransformer', () => {
  describe('ward work items', () => {
    it('VALID: {role: ward, wardMode: full} => returns 10 (FLOOR BOSS)', () => {
      const workItem = WorkItemStub({ role: 'ward', wardMode: 'full', dependsOn: [] });
      const allItemMap = new Map([[workItem.id, workItem]]);

      const result = wardAwareConfigIndexTransformer({ workItem, allItemMap });

      expect(result).toBe(10);
    });

    it('VALID: {role: ward, wardMode: changed} => returns 5 (MINI BOSS)', () => {
      const workItem = WorkItemStub({ role: 'ward', wardMode: 'changed', dependsOn: [] });
      const allItemMap = new Map([[workItem.id, workItem]]);

      const result = wardAwareConfigIndexTransformer({ workItem, allItemMap });

      expect(result).toBe(5);
    });
  });

  describe('non-ward work items', () => {
    it('VALID: {role: codeweaver} => returns 3 (FORGE)', () => {
      const workItem = WorkItemStub({ role: 'codeweaver' });
      const allItemMap = new Map([[workItem.id, workItem]]);

      const result = wardAwareConfigIndexTransformer({ workItem, allItemMap });

      expect(result).toBe(3);
    });

    it('VALID: {role: flowrider} => returns 7 (GLUEWORKS)', () => {
      const workItem = WorkItemStub({ role: 'flowrider' });
      const allItemMap = new Map([[workItem.id, workItem]]);

      const result = wardAwareConfigIndexTransformer({ workItem, allItemMap });

      expect(result).toBe(7);
    });

    it('VALID: {role: groundstomper} => returns 8 (PROVING GROUNDS, straight after GLUEWORKS)', () => {
      const workItem = WorkItemStub({ role: 'groundstomper' });
      const allItemMap = new Map([[workItem.id, workItem]]);

      const result = wardAwareConfigIndexTransformer({ workItem, allItemMap });

      expect(result).toBe(8);
    });

    it('VALID: {role: bughunt} => returns 2 (HOMEBASE entrance, like the other intake roles)', () => {
      const workItem = WorkItemStub({ role: 'bughunt' });
      const allItemMap = new Map([[workItem.id, workItem]]);

      const result = wardAwareConfigIndexTransformer({ workItem, allItemMap });

      expect(result).toBe(2);
    });
  });
});
