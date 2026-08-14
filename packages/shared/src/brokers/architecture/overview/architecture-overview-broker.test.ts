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

  describe('file header PURPOSE documentation', () => {
    it('VALID: {} => includes the PURPOSE section with what it must and must not carry', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(/^### File Header PURPOSE$/mu);
      expect(result).toMatch(
        /^A file header's `PURPOSE:` line carries what the code cannot state about itself — why the file exists, and when to reach for THIS one rather than its nearest sibling\. It must NOT restate the return shape, the throwing behaviour, the parameters, what a contract validates, or the file's own name; all of that is derivable from the file, so prose restating it can only drift\.$/mu,
      );
    });

    it('VALID: {} => states PURPOSE is written last and points at get-syntax-rules', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^Write `PURPOSE` LAST, after the implementation it summarizes\. A PURPOSE written before the body describes intent, and intent and implementation diverge silently in the same authoring pass\.$/mu,
      );
      expect(result).toMatch(
        /^\*\*Get the full rule:\*\* Use `get-syntax-rules` tool for the MUST\/MUST NOT lists and worked examples from this repo \("What Belongs in PURPOSE"\)\.$/mu,
      );
    });
  });

  describe('present-tense documentation rule', () => {
    it('VALID: {} => bans historical framing across every documentation surface', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(/^### Present-Tense Documentation$/mu);
      expect(result).toMatch(
        /^Documentation states what the code does NOW\. This binds code comments, JSDoc, `PURPOSE` lines, test descriptions, and CLAUDE\.md files alike — never "used to do", "previously", "historically", or "before the X fix"\. Git is the history\.$/mu,
      );
    });

    it('VALID: {} => requires present-tense rationale and comment removal', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^When the current design needs rationale, state that rationale in present tense \("keys on toolUseId because…"\) rather than as a contrast with an implementation that no longer exists\. When you remove code, remove every comment that refers to what you removed\.$/mu,
      );
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
        /^\*\*Allowed in:\*\* `widgets\/`, `adapters\/`, `brokers\/`, `responders\/` only$/mu,
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

  describe('cross-package public API documentation', () => {
    it('VALID: {} => includes cross-package API section and subsections', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(/^## Cross-Package Public API$/mu);
      expect(result).toMatch(/^### Consuming another package's API$/mu);
      expect(result).toMatch(/^### Consumer TypeScript config$/mu);
      expect(result).toMatch(/^### Consumer jest config$/mu);
    });

    it('VALID: {} => documents the node10 source-resolution rule and base tsconfig extends', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^- \*\*node10 resolution\*\* \(`moduleResolution: "node"`.*rebuild before running\.$/mu,
      );
      expect(result).toMatch(/^ {2}"extends": "@dungeonmaster\/eslint-plugin\/tsconfig",$/mu);
    });
  });
});
