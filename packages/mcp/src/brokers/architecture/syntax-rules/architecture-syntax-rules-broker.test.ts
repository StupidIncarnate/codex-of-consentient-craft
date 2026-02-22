import { architectureSyntaxRulesBroker } from './architecture-syntax-rules-broker';
import { architectureSyntaxRulesBrokerProxy } from './architecture-syntax-rules-broker.proxy';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

type ContentText = ReturnType<typeof ContentTextStub>;

describe('architectureSyntaxRulesBroker', () => {
  describe('markdown generation', () => {
    it('VALID: {} => returns complete markdown with all universal syntax rules', () => {
      architectureSyntaxRulesBrokerProxy();
      const result = architectureSyntaxRulesBroker();

      expect(typeof result).toBe('string');
      expect(result).toMatch(/# Universal Syntax Rules/u);
      expect(result).toMatch(/## File Naming/u);
      expect(result).toMatch(/## Function Exports/u);
      expect(result).toMatch(/## Summary Checklist/u);
    });

    it('VALID: {} => includes file naming rules with examples and violations', () => {
      architectureSyntaxRulesBrokerProxy();
      const result = architectureSyntaxRulesBroker();

      expect(result).toMatch(/All filenames must use kebab-case/u);
      expect(result).toMatch(/✅ `user-fetch-broker.ts`/u);
      expect(result).toMatch(/❌ `userFetchBroker.ts`/u);
    });

    it('VALID: {} => includes function export rules with code examples', () => {
      architectureSyntaxRulesBrokerProxy();
      const result = architectureSyntaxRulesBroker();

      expect(result).toMatch(/All functions must use export const with arrow function syntax/u);
      expect(result).toMatch(/```typescript/u);
      expect(result).toMatch(/export const userFetchBroker/u);
    });

    it('VALID: {} => includes type safety section with subsections', () => {
      architectureSyntaxRulesBrokerProxy();
      const result = architectureSyntaxRulesBroker();

      expect(result).toMatch(/### Strict Typing Required/u);
      expect(result).toMatch(/### For Uncertain Data/u);
      expect(result).toMatch(/### Type Assertions vs Satisfies/u);
    });

    it('VALID: {} => includes performance section with Reflect methods', () => {
      architectureSyntaxRulesBrokerProxy();
      const result = architectureSyntaxRulesBroker();

      expect(result).toMatch(/### Use Reflect Methods/u);
      expect(result).toMatch(/Reflect.deleteProperty\(\)/u);
      expect(result).toMatch(/Reflect.get\(\)/u);
    });

    it('VALID: {} => includes summary checklist with items', () => {
      architectureSyntaxRulesBrokerProxy();
      const result = architectureSyntaxRulesBroker();

      expect(result).toMatch(/## Summary Checklist/u);
      expect(result).toMatch(/- \[ \] File uses kebab-case naming/u);
      expect(result).toMatch(/- \[ \] No any, @ts-ignore, or type suppressions/u);
    });

    it('VALID: {} => formats code blocks correctly', () => {
      architectureSyntaxRulesBrokerProxy();
      const result = architectureSyntaxRulesBroker();

      const codeBlockPattern = /```typescript\n[\S\s]*?\n```/gu;
      const matches = result.match(codeBlockPattern);

      expect(matches).not.toBeNull();
      expect(matches?.length).toBeGreaterThan(0);
    });

    it('VALID: {} => includes examples with check marks and violations with X marks', () => {
      architectureSyntaxRulesBrokerProxy();
      const result = architectureSyntaxRulesBroker();

      expect(result).toMatch(/✅/u);
      expect(result).toMatch(/❌/u);
    });
  });

  describe('content structure', () => {
    it('VALID: {} => returns branded ContentText type', () => {
      architectureSyntaxRulesBrokerProxy();
      const result = architectureSyntaxRulesBroker();
      const expected: ContentText = ContentTextStub({ value: result });

      expect(result).toBe(expected);
    });

    it('VALID: {} => includes consistent markdown heading levels', () => {
      architectureSyntaxRulesBrokerProxy();
      const result = architectureSyntaxRulesBroker();

      expect(result).toMatch(/^# /mu);
      expect(result).toMatch(/^## /mu);
      expect(result).toMatch(/^### /mu);
    });

    it('VALID: {} => includes proper markdown list formatting', () => {
      architectureSyntaxRulesBrokerProxy();
      const result = architectureSyntaxRulesBroker();

      expect(result).toMatch(/^- /mu);
      expect(result).toMatch(/^- \[ \] /mu);
    });
  });
});
