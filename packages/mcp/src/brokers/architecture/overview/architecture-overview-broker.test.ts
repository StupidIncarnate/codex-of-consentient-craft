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

    it('VALID: {} => includes layer file structure example', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result.includes('**Structure:**')).toBe(true);
      expect(result.includes('user-fetch-broker.ts')).toBe(true);
      expect(result.includes('validate-input-layer-broker.ts')).toBe(true);
      expect(result.includes('format-response-layer-broker.ts')).toBe(true);
    });

    it('VALID: {} => includes layer files ARE characteristics', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result.includes('**Layer files ARE:**')).toBe(true);
      expect(result.includes('✅ Co-located with parent (same directory, flat structure)')).toBe(
        true,
      );
      expect(result.includes('✅ Full entities with own `.proxy.ts` and `.test.ts`')).toBe(true);
      expect(result.includes('✅ Independently testable')).toBe(true);
      expect(result.includes("✅ Scoped to parent's domain")).toBe(true);
    });

    it('VALID: {} => includes layer files are NOT characteristics', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result.includes('**Layer files are NOT:**')).toBe(true);
      expect(result.includes('❌ Utilities (those go in `transformers/` or `guards/`)')).toBe(true);
      expect(result.includes('❌ Reusable across parents')).toBe(true);
      expect(result.includes('❌ Separate domains')).toBe(true);
      expect(result.includes('❌ In subfolders')).toBe(true);
    });

    it('VALID: {} => includes testing guidance for layers', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result.includes('**Testing:**')).toBe(true);
      expect(
        result.includes('Each layer has its own test file following standard proxy pattern'),
      ).toBe(true);
      expect(result.includes('Create fresh proxy per test')).toBe(true);
    });

    it('VALID: {} => includes lint enforcement information', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result.includes('**Lint Enforcement:**')).toBe(true);
      expect(result.includes('@questmaestro/enforce-project-structure')).toBe(true);
      expect(result.includes('@questmaestro/enforce-implementation-colocation')).toBe(true);
      expect(result.includes('validates `-layer-` appears before folder suffix')).toBe(true);
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

    it('VALID: {} => includes entry file examples showing what IS entry', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(
        result.includes(
          'brokers/user/fetch/user-fetch-broker.ts` ✅ Entry file (filename = folder path)',
        ),
      ).toBe(true);
      expect(result.includes('adapters/axios/get/axios-get-adapter.ts` ✅ Entry file')).toBe(true);
      expect(result.includes('contracts/user/user-contract.ts` ✅ Entry file')).toBe(true);
    });

    it('VALID: {} => includes entry file examples showing what is NOT entry', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(
        result.includes(
          'brokers/user/fetch/validate-helper.ts` ❌ NOT entry (has extra "validate")',
        ),
      ).toBe(true);
      expect(result.includes('validate-layer-broker.ts` ❌ NOT entry (has "validate-layer")')).toBe(
        true,
      );
      expect(result.includes('avatar-layer-widget.tsx` ❌ NOT entry (has "avatar-layer")')).toBe(
        true,
      );
    });

    it('VALID: {} => includes layer file import restrictions', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(
        result.includes(
          '**Layer files** (`-layer-` in filename) are internal implementation details',
        ),
      ).toBe(true);
      expect(
        result.includes('they can ONLY be imported within their own domain folder, never across'),
      ).toBe(true);
    });

    it('VALID: {} => includes correct import examples', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result.includes('✅ CORRECT - Importing entry file (name matches folders)')).toBe(
        true,
      );
      expect(result.includes('❌ WRONG - Importing non-entry files (names have extra parts)')).toBe(
        true,
      );
      expect(result.includes('validateLayerBroker')).toBe(true);
      expect(result.includes('avatarLayerWidget')).toBe(true);
    });
  });
});
