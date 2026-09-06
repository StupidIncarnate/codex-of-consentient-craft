import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { composerScopeKeyTransformer } from './composer-scope-key-transformer';

describe('composerScopeKeyTransformer', () => {
  describe('create surface', () => {
    it('EMPTY: {questId: null, surface: "main"} => returns the create-surface sentinel', () => {
      const result = composerScopeKeyTransformer({ questId: null, surface: 'main' });

      expect(result).toBe('create');
    });

    it('EMPTY: {questId: null, surface: "followup"} => still returns the create-surface sentinel', () => {
      const result = composerScopeKeyTransformer({ questId: null, surface: 'followup' });

      expect(result).toBe('create');
    });
  });

  describe('main composer, real quest', () => {
    it('VALID: {questId: "quest-a", surface: "main"} => returns the bare questId', () => {
      const questId = QuestIdStub({ value: 'quest-a' });

      const result = composerScopeKeyTransformer({ questId, surface: 'main' });

      expect(result).toBe('quest-a');
    });

    it('VALID: {questId: "quest-b", surface: "main"} => a different quest returns a different scope key', () => {
      const questId = QuestIdStub({ value: 'quest-b' });

      const result = composerScopeKeyTransformer({ questId, surface: 'main' });

      expect(result).toBe('quest-b');
    });
  });

  describe('follow-up composer, real quest', () => {
    it('VALID: {questId: "quest-a", surface: "followup"} => appends the follow-up suffix', () => {
      const questId = QuestIdStub({ value: 'quest-a' });

      const result = composerScopeKeyTransformer({ questId, surface: 'followup' });

      expect(result).toBe('quest-a:followup');
    });

    it('VALID: {questId: "quest-a", surface} => the main and follow-up scope keys for the SAME quest differ', () => {
      const questId = QuestIdStub({ value: 'quest-a' });

      const mainScope = composerScopeKeyTransformer({ questId, surface: 'main' });
      const followupScope = composerScopeKeyTransformer({ questId, surface: 'followup' });

      expect(mainScope).toBe('quest-a');
      expect(followupScope).toBe('quest-a:followup');
    });
  });
});
