import { ContextStub, ContextIdStub, ObservableStub } from '@dungeonmaster/shared/contracts';

import { questHasValidContextRefsGuard } from './quest-has-valid-context-refs-guard';

describe('questHasValidContextRefsGuard', () => {
  describe('valid references', () => {
    it('VALID: {observable references existing context} => returns true', () => {
      const ctxId = ContextIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const contexts = [ContextStub({ id: ctxId })];
      const observables = [ObservableStub({ contextId: ctxId })];

      const result = questHasValidContextRefsGuard({ observables, contexts });

      expect(result).toBe(true);
    });

    it('VALID: {multiple observables all reference valid contexts} => returns true', () => {
      const ctxId1 = ContextIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const ctxId2 = ContextIdStub({ value: 'a47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const contexts = [ContextStub({ id: ctxId1 }), ContextStub({ id: ctxId2, name: 'Other' })];
      const observables = [
        ObservableStub({ id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', contextId: ctxId1 }),
        ObservableStub({ id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', contextId: ctxId2 }),
      ];

      const result = questHasValidContextRefsGuard({ observables, contexts });

      expect(result).toBe(true);
    });

    it('VALID: {empty observables} => returns true', () => {
      const contexts = [ContextStub()];

      const result = questHasValidContextRefsGuard({ observables: [], contexts });

      expect(result).toBe(true);
    });
  });

  describe('invalid references', () => {
    it('INVALID_CONTEXT: {observable references non-existent context} => returns false', () => {
      const ctxId = ContextIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const otherCtxId = ContextIdStub({ value: 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee' });
      const contexts = [ContextStub({ id: ctxId })];
      const observables = [ObservableStub({ contextId: otherCtxId })];

      const result = questHasValidContextRefsGuard({ observables, contexts });

      expect(result).toBe(false);
    });

    it('INVALID_CONTEXT: {empty contexts array} => returns false', () => {
      const observables = [ObservableStub()];

      const result = questHasValidContextRefsGuard({ observables, contexts: [] });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {observables: undefined} => returns false', () => {
      const result = questHasValidContextRefsGuard({ contexts: [] });

      expect(result).toBe(false);
    });

    it('EMPTY: {contexts: undefined} => returns false', () => {
      const result = questHasValidContextRefsGuard({ observables: [] });

      expect(result).toBe(false);
    });

    it('EMPTY: {both undefined} => returns false', () => {
      const result = questHasValidContextRefsGuard({});

      expect(result).toBe(false);
    });
  });
});
