import { architectureOverviewBroker } from './architecture-overview-broker';
import { architectureOverviewBrokerProxy } from './architecture-overview-broker.proxy';

describe('architectureOverviewBroker', () => {
  describe('markdown structure', () => {
    it('VALID: {} => returns markdown with all main sections', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(/^# Architecture Overview/mu);
      expect(result).toMatch(/^## Folder Types$/mu);
      expect(result).toMatch(/^## Architecture Layer Diagram$/mu);
      expect(result).toMatch(/^## Decision Tree: Where Does Code Go\?$/mu);
      expect(result).toMatch(/^## Critical Rules Summary$/mu);
    });

    it('VALID: {} => returns markdown with table header', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(/^\| Folder \| Purpose \| Depth \| When to Use \|$/mu);
    });

    it('VALID: {} => returns markdown with all 14 folder types', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(/^\| statics\/ \|/mu);
      expect(result).toMatch(/^\| contracts\/ \|/mu);
      expect(result).toMatch(/^\| guards\/ \|/mu);
      expect(result).toMatch(/^\| transformers\/ \|/mu);
      expect(result).toMatch(/^\| brokers\/ \|/mu);
    });

    it('VALID: {} => orders folders by depth (leaf nodes first)', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      const staticsIndex = result.indexOf('| statics/ |');
      const brokersIndex = result.indexOf('| brokers/ |');

      expect(staticsIndex).toBeGreaterThan(0);
      expect(brokersIndex).toBeGreaterThan(0);
      expect(staticsIndex).toBeLessThan(brokersIndex);
    });

    it('VALID: {} => includes folder depth values', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(/^\| statics\/ \|.+\| 1 \|.+\|$/mu);
      expect(result).toMatch(/^\| statics\/ \|.+Need immutable config or constants/mu);
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

  describe('quality commands', () => {
    it('VALID: {} => includes quality commands section with ward guidance', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(/^## Quality Commands$/mu);
      expect(result).toMatch(/^npm run ward /mu);
      expect(result).toMatch(/^npm run ward -- --only test/mu);
      expect(result).toMatch(/^npm run ward -- --only lint/mu);
      expect(result).toMatch(/^\| `npx tsc --noEmit` \| `npm run ward -- --only typecheck` \|$/mu);
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

      expect(result).toMatch(/^\*\*Allowed in:\*\* `widgets\/`/mu);
      expect(result).toMatch(/^\*\*Allowed in:\*\*.+`brokers\/`/mu);
      expect(result).toMatch(/^\*\*Allowed in:\*\*.+`responders\/`/mu);
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
      expect(result).toMatch(/^- Layer calls different dependencies/mu);
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
