import { WorkItemStub } from '@dungeonmaster/shared/contracts';

import { wardAwareConfigIndexTransformer } from './ward-aware-config-index-transformer';

describe('wardAwareConfigIndexTransformer', () => {
  describe('ward work items', () => {
    it('VALID: {role: ward, wardMode: full} => returns 15 (FLOOR BOSS)', () => {
      const workItem = WorkItemStub({ role: 'ward', wardMode: 'full', dependsOn: [] });
      const allItemMap = new Map([[workItem.id, workItem]]);

      const result = wardAwareConfigIndexTransformer({ workItem, allItemMap });

      expect(result).toBe(15);
    });

    it('VALID: {role: ward, wardMode: changed} => returns 4 (MINI BOSS)', () => {
      const workItem = WorkItemStub({ role: 'ward', wardMode: 'changed', dependsOn: [] });
      const allItemMap = new Map([[workItem.id, workItem]]);

      const result = wardAwareConfigIndexTransformer({ workItem, allItemMap });

      expect(result).toBe(4);
    });
  });

  describe('non-ward work items', () => {
    it('VALID: {role: codeweaver} => returns 2 (FORGE)', () => {
      const workItem = WorkItemStub({ role: 'codeweaver' });
      const allItemMap = new Map([[workItem.id, workItem]]);

      const result = wardAwareConfigIndexTransformer({ workItem, allItemMap });

      expect(result).toBe(2);
    });

    it('VALID: {role: flowrider} => returns 6 (GLUEWORKS)', () => {
      const workItem = WorkItemStub({ role: 'flowrider' });
      const allItemMap = new Map([[workItem.id, workItem]]);

      const result = wardAwareConfigIndexTransformer({ workItem, allItemMap });

      expect(result).toBe(6);
    });
  });
});
