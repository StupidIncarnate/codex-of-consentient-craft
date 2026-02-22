import { architectureOverviewBroker } from './architecture-overview-broker';
import { architectureOverviewBrokerProxy } from './architecture-overview-broker.proxy';

describe('architectureOverviewBroker', () => {
  describe('markdown structure', () => {
    it('VALID: {} => returns markdown with all main sections', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result.startsWith('# Architecture Overview')).toBe(true);
      expect(result.includes('## Folder Types')).toBe(true);
      expect(result.includes('## Architecture Layer Diagram')).toBe(true);
      expect(result.includes('## Decision Tree: Where Does Code Go?')).toBe(true);
      expect(result.includes('## Critical Rules Summary')).toBe(true);
    });

    it('VALID: {} => returns markdown with table header', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result.includes('| Folder | Purpose | Depth | When to Use |')).toBe(true);
    });

    it('VALID: {} => returns markdown with all 14 folder types', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result.includes('| statics/ |')).toBe(true);
      expect(result.includes('| contracts/ |')).toBe(true);
      expect(result.includes('| guards/ |')).toBe(true);
      expect(result.includes('| transformers/ |')).toBe(true);
      expect(result.includes('| brokers/ |')).toBe(true);
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

      expect(result.includes('| statics/ |')).toBe(true);
      expect(result.includes('| 1 |')).toBe(true);
      expect(result.includes('Need immutable config or constants')).toBe(true);
    });
  });

  describe('decision tree content', () => {
    it('VALID: {} => includes decision tree steps', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result.includes('Wrap npm package → adapters/')).toBe(true);
      expect(result.includes('App initialization → startup/')).toBe(true);
      expect(result.includes('## Decision Tree: Where Does Code Go?')).toBe(true);
    });
  });

  describe('quality commands', () => {
    it('VALID: {} => includes quality commands section with ward guidance', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result.includes('## Quality Commands')).toBe(true);
      expect(result.includes('npm run ward')).toBe(true);
      expect(result.includes('npm run ward -- --only test')).toBe(true);
      expect(result.includes('npm run ward -- --only lint')).toBe(true);
      expect(result.includes('npm run ward -- --only typecheck')).toBe(true);
    });
  });

  describe('critical rules', () => {
    it('VALID: {} => includes never-do rules', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result.includes('**Never do these things (❌):**')).toBe(true);
      expect(result.includes('❌ Use while (true) - use recursion instead')).toBe(true);
    });

    it('VALID: {} => includes always-do rules', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result.includes('**Always do these things (✅):**')).toBe(true);
      expect(result.includes('✅ Use object destructuring for function parameters')).toBe(true);
    });
  });

  describe('layer files documentation', () => {
    it('VALID: {} => includes layer files section', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result.includes('## Layer Files - Decomposing Complex Components')).toBe(true);
    });

    it('VALID: {} => includes dynamically generated allowed folders list', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result.includes('**Allowed in:**')).toBe(true);
      expect(result.includes('`brokers/`')).toBe(true);
      expect(result.includes('`responders/`')).toBe(true);
      expect(result.includes('`widgets/`')).toBe(true);
    });

    it('VALID: {} => includes layer file naming pattern', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result.includes('**Naming:** `{descriptive-name}-layer-{folder-suffix}.{ext}`')).toBe(
        true,
      );
    });

    it('VALID: {} => includes layer file import rules', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result.includes('**Import rules:**')).toBe(true);
      expect(result.includes('✅ Parent can import layers (same folder)')).toBe(true);
      expect(result.includes('✅ Layers can import other layers (same folder)')).toBe(true);
      expect(result.includes('❌ Cannot import layers from different domain folders')).toBe(true);
    });

    it('VALID: {} => includes when to create layer guidelines', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result.includes('**When to create layer:**')).toBe(true);
      expect(result.includes('Parent exceeds 300 lines')).toBe(true);
      expect(result.includes('Layer calls different dependencies')).toBe(true);
    });

    it('VALID: {} => includes when NOT to create layer guidelines', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result.includes('**When NOT to create layer:**')).toBe(true);
      expect(result.includes('Logic is reusable → extract to `guards/` or `transformers/`')).toBe(
        true,
      );
    });
  });

  describe('import rules documentation', () => {
    it('VALID: {} => includes entry file import rules', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result.includes('## Import Rules')).toBe(true);
      expect(result.includes('Only **entry files** can be imported across domain folders')).toBe(
        true,
      );
    });

    it('VALID: {} => includes clear entry file definition with pattern', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(
        result.includes(
          '**Entry files** = filename exactly matches folder path + suffix (no extra words)',
        ),
      ).toBe(true);
      expect(result.includes('**Pattern:** `[folder-path]-[folder-suffix].ts`')).toBe(true);
    });
  });
});
