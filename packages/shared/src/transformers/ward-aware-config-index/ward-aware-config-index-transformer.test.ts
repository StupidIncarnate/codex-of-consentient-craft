import { WorkItemStub } from '@dungeonmaster/shared/contracts';

import { wardAwareConfigIndexTransformer } from './ward-aware-config-index-transformer';

describe('wardAwareConfigIndexTransformer', () => {
  describe('ward work items', () => {
    it('VALID: {role: ward, wardMode: full} => returns 19 (FLOOR BOSS)', () => {
      const workItem = WorkItemStub({ role: 'ward', wardMode: 'full', dependsOn: [] });
      const allItemMap = new Map([[workItem.id, workItem]]);

      const result = wardAwareConfigIndexTransformer({ workItem, allItemMap });

      expect(result).toBe(19);
    });

    it('VALID: {role: ward, wardMode: changed} => returns 8 (MINI BOSS)', () => {
      const workItem = WorkItemStub({ role: 'ward', wardMode: 'changed', dependsOn: [] });
      const allItemMap = new Map([[workItem.id, workItem]]);

      const result = wardAwareConfigIndexTransformer({ workItem, allItemMap });

      expect(result).toBe(8);
    });
  });

  describe('non-ward work items', () => {
    it('VALID: {role: codeweaver} => returns 6 (FORGE)', () => {
      const workItem = WorkItemStub({ role: 'codeweaver' });
      const allItemMap = new Map([[workItem.id, workItem]]);

      const result = wardAwareConfigIndexTransformer({ workItem, allItemMap });

      expect(result).toBe(6);
    });

    it('VALID: {role: flowrider} => returns 10 (GLUEWORKS)', () => {
      const workItem = WorkItemStub({ role: 'flowrider' });
      const allItemMap = new Map([[workItem.id, workItem]]);

      const result = wardAwareConfigIndexTransformer({ workItem, allItemMap });

      expect(result).toBe(10);
    });
  });
});
