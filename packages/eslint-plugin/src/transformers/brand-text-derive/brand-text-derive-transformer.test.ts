import { brandTextDeriveTransformer } from './brand-text-derive-transformer';

describe('brandTextDeriveTransformer', () => {
  describe('owner only', () => {
    it("VALID: {path: ['questContract']} => returns 'Quest'", () => {
      const result = brandTextDeriveTransformer({
        path: ['questContract'],
      });

      expect(result).toBe('Quest');
    });

    it("VALID: {path: ['workItemContract']} => returns 'WorkItem'", () => {
      const result = brandTextDeriveTransformer({
        path: ['workItemContract'],
      });

      expect(result).toBe('WorkItem');
    });

    it("EDGE: {path: ['questFields']} => keeps a name with no Contract suffix, capitalised", () => {
      const result = brandTextDeriveTransformer({
        path: ['questFields'],
      });

      expect(result).toBe('QuestFields');
    });
  });

  describe('owner plus keys', () => {
    it("VALID: {path: ['questContract', 'id']} => returns 'QuestId'", () => {
      const result = brandTextDeriveTransformer({
        path: ['questContract', 'id'],
      });

      expect(result).toBe('QuestId');
    });

    it("VALID: {path: ['workItemContract', 'retryCount']} => returns 'WorkItemRetryCount'", () => {
      const result = brandTextDeriveTransformer({
        path: ['workItemContract', 'retryCount'],
      });

      expect(result).toBe('WorkItemRetryCount');
    });

    it("VALID: {path: ['questContract', 'owner', 'name']} => nested keys add in order", () => {
      const result = brandTextDeriveTransformer({
        path: ['questContract', 'owner', 'name'],
      });

      expect(result).toBe('QuestOwnerName');
    });

    it("VALID: {path: ['ctxContract', 'used_percentage']} => snake_case key becomes PascalCase", () => {
      const result = brandTextDeriveTransformer({
        path: ['ctxContract', 'used_percentage'],
      });

      expect(result).toBe('CtxUsedPercentage');
    });

    it("VALID: {path: ['questContract', 'counts', 'Key']} => record key segment appends", () => {
      const result = brandTextDeriveTransformer({
        path: ['questContract', 'counts', 'Key'],
      });

      expect(result).toBe('QuestCountsKey');
    });

    it("VALID: {path: ['questContract', 'span', '0']} => tuple index appends", () => {
      const result = brandTextDeriveTransformer({
        path: ['questContract', 'span', '0'],
      });

      expect(result).toBe('QuestSpan0');
    });

    it("VALID: {path: ['questContract', 'kebab-key']} => kebab-case key becomes PascalCase", () => {
      const result = brandTextDeriveTransformer({
        path: ['questContract', 'kebab-key'],
      });

      expect(result).toBe('QuestKebabKey');
    });
  });
});
