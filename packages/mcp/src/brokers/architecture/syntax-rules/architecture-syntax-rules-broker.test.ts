import { architectureSyntaxRulesBroker } from './architecture-syntax-rules-broker';
import { architectureSyntaxRulesBrokerProxy } from './architecture-syntax-rules-broker.proxy';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

type ContentText = ReturnType<typeof ContentTextStub>;

describe('architectureSyntaxRulesBroker', () => {
  describe('markdown generation', () => {
    it('VALID: {} => returns complete markdown with all universal syntax rules', () => {
      architectureSyntaxRulesBrokerProxy();
      const result = architectureSyntaxRulesBroker();

      expect(result).toMatch(/^# Universal Syntax Rules$/mu);
      expect(result).toMatch(/^## File Naming$/mu);
      expect(result).toMatch(/^## Function Exports$/mu);
      expect(result).toMatch(/^## Summary Checklist$/mu);
    });

    it('VALID: {} => includes file naming rules with examples and violations', () => {
      architectureSyntaxRulesBrokerProxy();
      const result = architectureSyntaxRulesBroker();

      expect(result).toMatch(/^\*\*All filenames must use kebab-case\*\*$/mu);
      expect(result).toMatch(/^- ✅ `user-fetch-broker\.ts`$/mu);
      expect(result).toMatch(/^- ❌ `userFetchBroker\.ts`$/mu);
    });

    it('VALID: {} => includes function export rules with code examples', () => {
      architectureSyntaxRulesBrokerProxy();
      const result = architectureSyntaxRulesBroker();

      expect(result).toMatch(
        /^\*\*All functions must use export const with arrow function syntax\*\*$/mu,
      );
      expect(result).toMatch(/^```typescript$/mu);
      expect(result).toMatch(
        /^export const userFetchBroker = async \(\{userId\}: \{userId: UserId\}\): Promise<User> => \{ \/\* implementation \*\/ \};$/mu,
      );
    });

    it('VALID: {} => includes type safety section with subsections', () => {
      architectureSyntaxRulesBrokerProxy();
      const result = architectureSyntaxRulesBroker();

      expect(result).toMatch(/^### Strict Typing Required$/mu);
      expect(result).toMatch(/^### For Uncertain Data$/mu);
      expect(result).toMatch(/^### Type Assertions vs Satisfies$/mu);
    });

    it('VALID: {} => includes performance section with Reflect methods', () => {
      architectureSyntaxRulesBrokerProxy();
      const result = architectureSyntaxRulesBroker();

      expect(result).toMatch(/^\*\*Reflect\.deleteProperty\(\):\*\*$/mu);
      expect(result).toMatch(/^\*\*Reflect\.get\(\):\*\*$/mu);
    });

    it('VALID: {} => includes summary checklist with items', () => {
      architectureSyntaxRulesBrokerProxy();
      const result = architectureSyntaxRulesBroker();

      expect(result).toMatch(/^## Summary Checklist$/mu);
      expect(result).toMatch(/^- \[ \] File uses kebab-case naming$/mu);
      expect(result).toMatch(/^- \[ \] No any, @ts-ignore, or type suppressions$/mu);
    });

    it('VALID: {} => formats code blocks correctly', () => {
      architectureSyntaxRulesBrokerProxy();
      const result = architectureSyntaxRulesBroker();

      expect(result).toMatch(/^```typescript$/mu);
      expect(result).toMatch(/^```$/mu);
    });

    it('VALID: {} => includes examples with check marks and violations with X marks', () => {
      architectureSyntaxRulesBrokerProxy();
      const result = architectureSyntaxRulesBroker();

      expect(result).toMatch(/^- ✅ `user-fetch-broker\.ts`$/mu);
      expect(result).toMatch(/^- ❌ `userFetchBroker\.ts`$/mu);
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

      expect(result).toMatch(/^# Universal Syntax Rules$/mu);
      expect(result).toMatch(/^## File Naming$/mu);
      expect(result).toMatch(/^### Strict Typing Required$/mu);
    });

    it('VALID: {} => includes proper markdown list formatting', () => {
      architectureSyntaxRulesBrokerProxy();
      const result = architectureSyntaxRulesBroker();

      expect(result).toMatch(/^- ✅ `user-fetch-broker\.ts`$/mu);
      expect(result).toMatch(/^- \[ \] File uses kebab-case naming$/mu);
    });
  });
});
