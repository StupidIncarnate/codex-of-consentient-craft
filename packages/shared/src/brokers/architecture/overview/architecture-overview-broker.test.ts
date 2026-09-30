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
        /^\*\*Allowed in:\*\* `bindings\/`, `contracts\/`, `flows\/`, `statics\/`, `transformers\/`, `widgets\/`, `brokers\/`, `responders\/` only$/mu,
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
      expect(result).toMatch(/^### Starting a new package$/mu);
    });

    it('VALID: {} => documents the source-condition resolution rule for ward checks and the dist runtime path', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^- \*\*Ward's typecheck, lint, unit and integration checks set the `source` condition\*\*, .*rebuild the package before running those\.$/mu,
      );
    });

    it('VALID: {} => instructs create-package instead of hand-writing package configs', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^Do not hand-write a package's `tsconfig\.json`, `tsconfig\.build\.json` or `jest\.config\.js`, and do not copy them off a sibling\. Run:$/mu,
      );
      expect(result).toMatch(/^dungeonmaster create-package --name <name> --type <packageType>$/mu);
    });

    it('VALID: {} => bans composite and a references array, and states the TS6307 consequence', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^\*\*No config sets `composite`, and none carries a `references` array\.\*\* Nothing consumes project references, and `composite` forces every file the program reaches into `include` — so one import of a file the build config `exclude`s \(a `\.test\.ts`, a harness\) becomes a hard TS6307 instead of a file the emitter skips\.$/mu,
      );
    });

    it('VALID: {} => the jest passage names the repo-root base and its customExportConditions, not the published base', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^\*\*A jest config inherits `testEnvironmentOptions` from the REPO-ROOT base and never pins its own\.\*\* That base alone carries `customExportConditions: \["source", "require", "default"\]`,.*The published `@dungeonmaster\/testing\/jest-config-base` omits the list deliberately — an INSTALLED package ships `dist` only and has no source barrel to resolve to — so spreading the published base inside this monorepo IS the stale-green defect\.$/mu,
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
        /^Error classes are the one `export class` exception\. A default export is allowed only where a system genuinely REQUIRES one, never where it merely prefers one\. An object type that leaves a function is a contract in `contracts\/`\. A type used only inside one function body stays inline\.$/mu,
      );
    });

    it('VALID: {} => bans the inline type-export form export {type User}', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^export \{type User\} from '\.\/user-contract'; {8}\/\/ ❌ inline form, banned here$/mu,
      );
    });

    it('VALID: {} => names the two conventions no lint rule checks yet', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^Nearly every rule below is enforced by ESLint, and a violation is a failed build, not a style note\. Two are conventions no rule checks yet: never parse one id into another brand, and an object type that leaves a function belongs in `contracts\/`\.$/mu,
      );
    });

    it('VALID: {} => brands object contracts and lets an owner-id parameter take the owner field type', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^Every object contract, and every string and number field in it, is branded\. A loose parameter, return or local is plain: a scalar read from a loose source is returned plain, and a value that came from a contract keeps its brand\. A parameter holding another object's id takes that owner's field type \(`User\['id'\]`\), and `enforce-owner-field-reuse` checks it in every folder but `errors\/`\. Every other parameter may be a plain `string`\.$/mu,
      );
      expect(result).toMatch(
        /^export const fetchUser = \(\{userId\}: \{userId: string\}\): Promise<User> => \{ \/\* … \*\/ \}; {2}\/\/ ❌ userId is an owner's id: type it User\['id'\]$/mu,
      );
    });

    it('VALID: {} => teaches the id-reuse field and refuses re-parsing one id into another brand', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^questId: questContract\.shape\.id, {27}\/\/ ✅ the field reuses the owner's schema$/mu,
      );
      expect(result).toMatch(
        /^const workItemId = workItemContract\.shape\.id\.parse\(questId\); {2}\/\/ ❌ one id parsed into another brand$/mu,
      );
    });

    it('VALID: {} => states the return rule for void and { success: true }', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^\*\*Return what your calls told you\.\*\* `void` only when every call you discard returned `void`\. `\{ success: true \}` counts as `void`\. `enforce-folder-return-types` rejects a `void` return, or a return type that can hold one value only, when the function discards a call that returned something real\.$/mu,
      );
    });

    it('VALID: {} => parses outside data through a contract and keeps a plain number map plain', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^const data = apiResponseContract\.parse\(JSON\.parse\(response\)\); {2}\/\/ ✅ a contract parses outside data$/mu,
      );
      expect(result).toMatch(/^const indexMap = new Map<ChatEntry, number>\(\); {2}\/\/ ✅$/mu);
    });

    it('VALID: {} => teaches the gateway as the only way to reach an outside package', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(/^## Outside Packages: the Gateway$/mu);
      expect(result).toMatch(
        /^An outside package is reached only through the gateway: `#gateway\/<folder>\/<subpath>`, where `<folder>` is `npm`, `node`, `browser` or `bin`\. Every folder type imports outside things through it, types included, and nothing imports a raw package\.$/mu,
      );
      expect(result).toMatch(
        /^\| lib\/ \| brokers\/, or `#gateway` for an outside package \| An outside package is reached only through the gateway: `#gateway\/<folder>\/<subpath>` \|$/mu,
      );
      expect(result).toMatch(
        /^- `brokers\/quest\/load\/quest-load-broker\.ts` ✅ name is the folder path$/mu,
      );
    });

    it('VALID: {} => composes the gateway wrapper proxy in the proxy of the file that calls it', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^Mocks go at I\/O boundaries and nowhere else\. The proxy of the file that calls a gateway wrapper composes that wrapper's proxy, imported from its own file\. MSW answers HTTP and WebSocket\. A global mock covers non-determinism like `Date\.now`, and every broker, guard, transformer and widget runs real\. The `\.proxy\.ts` beside each file does that setup and exposes scenario methods rather than raw mocks\.$/mu,
      );
    });

    it('VALID: {} => requires PURPOSE to carry why the file exists and which sibling to pick', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^\*\*PURPOSE carries only what the code cannot state about itself:\*\* why the file exists, and when to reach for THIS one over its nearest sibling\. That second sentence is the highest-value line in the header and the one most often missing — a reader scanning `discover` output already has the name and the signature, and cannot get "which of these three is mine" anywhere else\.$/mu,
      );
    });

    it('VALID: {} => reconciles the write-last rule with the hook that demands PURPOSE up front', () => {
      architectureOverviewBrokerProxy();

      const result = architectureOverviewBroker();

      expect(result).toMatch(
        /^\*\*PURPOSE must exist before the file does, and must be rewritten once the file is real\.\*\* The pre-edit lint hook refuses a write without it, so the header you first submit is necessarily written against a plan rather than an implementation — which is the drift this rule exists to catch\. Treat that first one as a placeholder\. Before you leave the file, read the body you actually wrote and REWRITE the header to describe it\.$/mu,
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
