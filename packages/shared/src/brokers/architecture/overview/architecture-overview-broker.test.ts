import { architectureOverviewBroker } from './architecture-overview-broker';
import { architectureOverviewBrokerProxy } from './architecture-overview-broker.proxy';

describe('architectureOverviewBroker', () => {
  describe('markdown structure', () => {
    it('VALID: {} => returns markdown with all main sections', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(/^# Architecture Overview$/mu);
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

      expect(result).toMatch(
        /^\| statics\/ \| Immutable configuration values and constants\. Single source of truth for magic numbers, limits, and unchanging data\. \| 1 \| Need immutable config or constants \|$/mu,
      );
      expect(result).toMatch(
        /^\| contracts\/ \| Type definitions and validation schemas using Zod\. All data structures must be defined here with branded types\. \| 1 \| Define data structure with validation \|$/mu,
      );
      expect(result).toMatch(
        /^\| guards\/ \| Pure boolean functions that validate conditions\. Return true\/false, no side effects\. \| 1 \| Boolean check or type guard \|$/mu,
      );
      expect(result).toMatch(
        /^\| transformers\/ \| Pure data transformation functions\. Map input types to output types without side effects\. \| 1 \| Transform data shape A to B \|$/mu,
      );
      expect(result).toMatch(
        /^\| brokers\/ \| Business logic orchestration\. Compose adapters, guards, transformers to implement domain operations\. \| 2 \| Business logic operations \|$/mu,
      );
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
      expect(result).toMatch(
        /^\| statics\/ \| Immutable configuration values and constants\. Single source of truth for magic numbers, limits, and unchanging data\. \| 1 \| Need immutable config or constants \|$/mu,
      );
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
      expect(result).toMatch(/^npm run ward {42}# All checks, all packages$/mu);
      expect(result).toMatch(
        /^npm run ward -- --only test {27}# All tests \(unit \+ integration \+ e2e\)$/mu,
      );
      expect(result).toMatch(/^npm run ward -- --only lint {27}# Lint only$/mu);
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

  describe('code discovery documentation', () => {
    it('VALID: {} => includes code discovery section with tool comparison and parallel guidance', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(/^## Code Discovery$/mu);
      expect(result).toMatch(
        /^\*\*`discover` is the ONLY way to search this codebase\.\*\* System-level Glob, Grep, Search, and Find are ALL locked by hooks and will be blocked\. The `discover` MCP tool replaces all of them — it wraps glob and grep with structured output \(purposes, signatures, related files\)\.$/mu,
      );
      expect(result).toMatch(
        /^\*\*Parallel discovery:\*\* When you need multiple areas, batch glob calls into a single message:$/mu,
      );
      expect(result).toMatch(
        /^\*\*Always discover before creating\.\*\* Check if similar code exists\. If it does, extend it — don't duplicate\.$/mu,
      );
    });
  });

  describe('MCP tools reference', () => {
    it('VALID: {} => includes MCP tools reference header and architecture tools', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(/^## MCP Tools Reference$/mu);
      expect(result).toMatch(
        /^\| `get-architecture` \| \*\(none\)\* \| This document — folder types, import rules, decision tree \| First thing on any task \|$/mu,
      );
      expect(result).toMatch(
        /^\| `discover` \| `\{ glob\?, grep\? \}` \| File list with metadata\/purposes \| Orientation — find files, get a lay of the land \|$/mu,
      );
    });

    it('VALID: {} => includes folder detail, syntax rules, and testing patterns tools', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^\| `get-folder-detail` \| `\{ folderType \}` \| Naming, imports, constraints, code examples, proxy requirements \| Before creating\/modifying files in a folder type \|$/mu,
      );
      expect(result).toMatch(
        /^\| `get-syntax-rules` \| \*\(none\)\* \| File naming, exports, types, destructuring conventions \| Ensuring code passes ESLint \|$/mu,
      );
      expect(result).toMatch(
        /^\| `get-testing-patterns` \| \*\(none\)\* \| Testing philosophy, proxy patterns, assertion rules, test structure \| Before writing tests or proxy files \|$/mu,
      );
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
