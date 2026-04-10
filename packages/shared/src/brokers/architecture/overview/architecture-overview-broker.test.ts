import { architectureOverviewBroker } from './architecture-overview-broker';
import { architectureOverviewBrokerProxy } from './architecture-overview-broker.proxy';

describe('architectureOverviewBroker', () => {
  describe('markdown structure', () => {
    it('VALID: {} => returns markdown with all main sections', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(/^# Architecture Overview$/mu);
      expect(result).toMatch(/^## Architecture Layer Diagram$/mu);
      expect(result).toMatch(/^## Decision Tree: Where Does Code Go\?$/mu);
      expect(result).toMatch(/^## Critical Rules Summary$/mu);
    });
  });

  describe('decision tree content', () => {
    it('VALID: {} => includes decision tree steps', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(/^\d+\. Wrap npm package → adapters\/$/mu);
      expect(result).toMatch(/^\d+\. App initialization → startup\/$/mu);
      expect(result).toMatch(/^## Decision Tree: Where Does Code Go\?$/mu);
    });
  });

  describe('critical rules', () => {
    it('VALID: {} => includes never-do rules', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(/^\*\*Never do these things \(❌\):\*\*$/mu);
      expect(result).toMatch(/^- ❌ Use while \(true\) - use recursion instead$/mu);
    });

    it('VALID: {} => includes always-do rules', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(/^\*\*Always do these things \(✅\):\*\*$/mu);
      expect(result).toMatch(/^- ✅ Use object destructuring for function parameters$/mu);
    });
  });

  describe('layer files documentation', () => {
    it('VALID: {} => includes layer files section', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(/^## Layer Files - Decomposing Complex Components$/mu);
    });

    it('VALID: {} => includes dynamically generated allowed folders list', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^\*\*Allowed in:\*\* `widgets\/`, `brokers\/`, `responders\/` only$/mu,
      );
    });

    it('VALID: {} => includes layer file naming pattern', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^\*\*Naming:\*\* `\{descriptive-name\}-layer-\{folder-suffix\}\.\{ext\}`$/mu,
      );
    });

    it('VALID: {} => includes layer file import rules', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(/^\*\*Import rules:\*\*$/mu);
      expect(result).toMatch(/^- ✅ Parent can import layers \(same folder\)$/mu);
      expect(result).toMatch(/^- ✅ Layers can import other layers \(same folder\)$/mu);
      expect(result).toMatch(/^- ❌ Cannot import layers from different domain folders$/mu);
    });

    it('VALID: {} => includes when to create layer guidelines', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(/^\*\*When to create layer:\*\*$/mu);
      expect(result).toMatch(/^- Parent exceeds 300 lines$/mu);
      expect(result).toMatch(/^- Layer calls different dependencies \(needs own proxy\)$/mu);
    });

    it('VALID: {} => includes when NOT to create layer guidelines', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(/^\*\*When NOT to create layer:\*\*$/mu);
      expect(result).toMatch(/^- Logic is reusable → extract to `guards\/` or `transformers\/`$/mu);
    });
  });

  describe('import rules documentation', () => {
    it('VALID: {} => includes entry file import rules', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(/^## Import Rules$/mu);
      expect(result).toMatch(
        /^Only \*\*entry files\*\* can be imported across domain folders\.$/mu,
      );
    });

    it('VALID: {} => includes clear entry file definition with pattern', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^\*\*Entry files\*\* = filename exactly matches folder path \+ suffix \(no extra words\)$/mu,
      );
      expect(result).toMatch(/^\*\*Pattern:\*\* `\[folder-path\]-\[folder-suffix\]\.ts`$/mu);
    });
  });
});
