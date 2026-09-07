import { architectureOverviewBroker } from './architecture-overview-broker';
import { architectureOverviewBrokerProxy } from './architecture-overview-broker.proxy';

describe('architectureOverviewBroker', () => {
  describe('markdown structure', () => {
    it('VALID: {} => returns markdown with all main sections', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(/^# Architecture Overview$/mu);
      expect(result).toMatch(/^## Architecture Layer Diagram$/mu);
      expect(result).toMatch(/^## Writing a File$/mu);
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

    it('VALID: {} => requires a proxy and a test on every layer, in the implementation extension', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^\*\*Structure:\*\* flat beside the parent, never in a subfolder\. Every layer carries its own proxy and its own test, and both take the implementation's extension, so a `\.tsx` layer takes `\.proxy\.tsx` and `\.test\.tsx`\.$/mu,
      );
    });

    it('VALID: {} => rejects a layer name that puts the descriptive part after -layer-', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^- ❌ `chat-message-layer-image-content-widget\.tsx` — the descriptive name goes before `-layer-`, not after$/mu,
      );
    });

    it('VALID: {} => keeps the npm-package call in the parent for adapter layers', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^\*\*In `adapters\/` only:\*\* the npm-package call stays in the parent\. Layers translate shapes the parent already fetched, so the adapter's proxy keeps mocking exactly one boundary\.$/mu,
      );
    });

    it('VALID: {} => includes layer file import rules', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(/^\*\*Import rules:\*\*$/mu);
      expect(result).toMatch(
        /^- ✅ Parent imports its layers by relative path \(`\.\/image-content-layer-widget`\)$/mu,
      );
      expect(result).toMatch(/^- ✅ Layers import each other the same way$/mu);
      expect(result).toMatch(
        /^- ❌ No file outside the folder imports a layer — not another domain, not a sibling action in the same domain$/mu,
      );
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
      expect(result).toMatch(
        /^- A second folder needs the logic → extract to `guards\/` or `transformers\/`$/mu,
      );
    });
  });

  describe('import rules documentation', () => {
    it('VALID: {} => includes entry file import rules', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(/^## Import Rules$/mu);
      expect(result).toMatch(
        /^Only \*\*entry files\*\* cross a domain folder boundary\. An entry file's name is its folder path plus the folder suffix and nothing else — `\[folder-path\]-\[folder-suffix\]\.ts`\.$/mu,
      );
    });

    it('VALID: {} => includes clear entry file definition with pattern', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^Only \*\*entry files\*\* cross a domain folder boundary\. An entry file's name is its folder path plus the folder suffix and nothing else — `\[folder-path\]-\[folder-suffix\]\.ts`\.$/mu,
      );
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

    it('VALID: {} => documents the checking/build tsconfig split with a build script', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^A sibling `tsconfig\.build\.json` extends it and carries only the keys that EMIT — `noEmit: false` among them, since the checking config turns emit off:$/mu,
      );
      expect(result).toMatch(/^ {2}"extends": "\.\/tsconfig\.json",$/mu);
      expect(result).toMatch(
        /^`build` runs `tsc -p tsconfig\.build\.json`; ward's typecheck runs `tsc --noEmit` against `tsconfig\.json` and writes nothing\.$/mu,
      );
    });

    it('VALID: {} => the build config example emits without composite, and the ban on composite/references is stated', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^ {2}"compilerOptions": \{ "noEmit": false, "outDir": "\.\/dist", "rootDir": "\.\/", "declaration": true \},$/mu,
      );
      expect(result).toMatch(
        /^\*\*No config sets `composite` and none carries a `references` array\.\*\* Nothing consumes project references, and `composite` forces every file the program reaches into `include` — so one import of a file the build config `exclude`s \(a `\.test\.ts`, a harness\) becomes a hard TS6307 instead of a file the emitter skips\.$/mu,
      );
    });

    it('VALID: {} => the jest passage names the repo-root base and its customExportConditions, not the published base', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^Each package's `jest\.config\.js` spreads the REPO-ROOT `jest\.config\.base\.js` and adds `roots: \["<rootDir>\/src"\]`\. The base registers the ts-jest AST transformers that make `registerMock` and proxy files work, the auto-reset setup, and `testEnvironmentOptions\.customExportConditions: \["source", "require", "default"\]`\.$/mu,
      );
      expect(result).toMatch(
        /^\*\*That conditions list is the load-bearing key and only the repo-root base carries it\.\*\* .+ has to repeat the list by hand\.$/mu,
      );
    });
  });

  describe('writing a file', () => {
    it('VALID: {} => rejects a filename that is camelCase, snake_case, or PascalCase', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^Filenames are kebab-case\. One file exports one thing, as a `const` arrow function\.$/mu,
      );
      expect(result).toMatch(/^\/\/ userFetchBroker\.ts {15}❌ camelCase$/mu);
      expect(result).toMatch(/^\/\/ format_date_transformer\.ts {7}❌ snake_case$/mu);
      expect(result).toMatch(/^\/\/ UserContract\.ts {18}❌ PascalCase$/mu);
    });

    it('VALID: {} => requires export const arrow, bans export default, reserves export class for error classes', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^export function userFetchBroker\(\) \{\} {10}\/\/ ❌ not an arrow const$/mu,
      );
      expect(result).toMatch(
        /^export default function userFetchBroker\(\) \{\} {2}\/\/ ❌ default export$/mu,
      );
      expect(result).toMatch(/^export default class User \{\} {18}\/\/ ❌ default export$/mu);
      expect(result).toMatch(
        /^Error classes are the one `export class` exception\. A default export is allowed only where a system genuinely REQUIRES one, never where it merely prefers one\. Types supporting the file's one export may sit beside it; a second broker may not\.$/mu,
      );
    });

    it('VALID: {} => bans the inline type-export form export {type User}', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^export \{type User\} from '\.\/user-contract'; {8}\/\/ ❌ inline form, banned here$/mu,
      );
    });

    it('VALID: {} => states the ban-primitives asymmetry between inputs and returns', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^`ban-primitives` is asymmetric on purpose: an input MAY take a raw `string`, a return MUST be branded\.$/mu,
      );
    });

    it('VALID: {} => requires PURPOSE to carry why the file exists and which sibling to pick, written last', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^\*\*PURPOSE carries only what the code cannot state about itself:\*\* why the file exists, and when to reach for THIS one over its nearest sibling\. That second sentence is the highest-value line in the header and the one most often missing — a reader scanning `discover` output already has the name and the signature, and cannot get "which of these three is mine" anywhere else\.$/mu,
      );
      expect(result).toMatch(
        /^\*\*Write PURPOSE LAST\*\*, as a summary of code that already exists\. Written first, it describes intent, and intent and implementation diverge silently inside the same authoring pass\.$/mu,
      );
    });

    it('VALID: {} => bans the three silent .catch forms', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(/^promise\.catch\(\(\) => undefined\); {17}\/\/ ❌ silent swallow$/mu);
      expect(result).toMatch(/^promise\.catch\(\(\) => \{\}\); {24}\/\/ ❌ empty$/mu);
      expect(result).toMatch(
        /^promise\.catch\(\(_err\) => \{ \/\* comment only \*\/ \}\); \/\/ ❌ a comment is not handling$/mu,
      );
    });

    it('VALID: {} => confines Reflect.get and Reflect.set to guard and contract files', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^`Reflect\.get` and `Reflect\.set` are confined to `\*-guard\.ts` and `\*-contract\.ts`\. Everywhere else they return `unknown` and skip validation, which is how they became a universal escape hatch\. Parse the shape through a contract at the boundary and read the fields directly\.$/mu,
      );
    });

    it('VALID: {} => requires process.stdout.write over console.log', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^process\.stdout\.write\('Processed ' \+ count \+ ' files\\n'\); {2}\/\/ ✅ CLI output, newline explicit$/mu,
      );
      expect(result).toMatch(/^console\.log\('Processed ' \+ count \+ ' files'\); {14}\/\/ ❌$/mu);
    });
  });
});
