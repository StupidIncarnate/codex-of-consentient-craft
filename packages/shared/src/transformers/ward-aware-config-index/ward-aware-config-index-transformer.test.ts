import { WorkItemStub } from '@dungeonmaster/shared/contracts';

import { wardAwareConfigIndexTransformer } from './ward-aware-config-index-transformer';

describe('wardAwareConfigIndexTransformer', () => {
  describe('ward work items', () => {
    it('VALID: {role: ward} => returns 8 (FLOOR BOSS), not 4 (MINI BOSS)', () => {
      const workItem = WorkItemStub({ role: 'ward', dependsOn: [] });

      const result = wardAwareConfigIndexTransformer({ workItem });

      expect(result).toBe(8);
    });
  });

  describe('non-ward work items', () => {
    it('VALID: {role: codeweaver} => returns 3 (FORGE)', () => {
      const workItem = WorkItemStub({ role: 'codeweaver' });

      const result = wardAwareConfigIndexTransformer({ workItem });

      expect(result).toBe(3);
    });

    it('VALID: {role: flowrider} => returns 6 (GLUEWORKS)', () => {
      const workItem = WorkItemStub({ role: 'flowrider' });

      const result = wardAwareConfigIndexTransformer({ workItem });

      expect(result).toBe(6);
    });

    it('VALID: {role: siegemaster} => returns 7 (ARENA, straight after GLUEWORKS)', () => {
      const workItem = WorkItemStub({ role: 'siegemaster' });

      const result = wardAwareConfigIndexTransformer({ workItem });

      expect(result).toBe(7);
    });

    it('VALID: {role: bughunt} => returns 2 (HOMEBASE entrance, like the other intake roles)', () => {
      const workItem = WorkItemStub({ role: 'bughunt' });

      const result = wardAwareConfigIndexTransformer({ workItem });

      expect(result).toBe(2);
    });
  });
});
