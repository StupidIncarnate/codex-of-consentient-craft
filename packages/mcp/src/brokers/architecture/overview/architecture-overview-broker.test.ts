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
});
