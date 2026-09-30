/**
 * PURPOSE: Generates ESLint configuration objects for Dungeonmaster projects with TypeScript and custom rules
 *
 * USAGE:
 * const { typescript, test, fileOverrides, ruleEnforceOn } = configDungeonmasterBroker();
 * // Returns ESLint configs for TypeScript files, test files, and file-specific overrides
 *
 * // For test environments (relaxes some strict rules):
 * const configs = configDungeonmasterBroker({ forTesting: true });
 * // Returns configs with relaxed rules like max-depth, no-magic-numbers for test code
 *
 * // With the gateway.bannedExports/restrictedTo config from .dungeonmaster.json:
 * const configs = configDungeonmasterBroker({ gatewayLintConfig });
 * // gatewayLintConfig MUST be read by the CALLER (eslint.config.js reads it once when it loads via
 * // configGatewayLintConfigBroker) — this broker takes no `startDir` and does no file I/O itself,
 * // because @dungeonmaster/eslint-plugin's own index.ts calls this at MODULE IMPORT time
 * // (`const plugin = StartEslintPlugin();`), so any I/O here would run merely from requiring the
 * // package — breaking every other package's tests the moment they import a plugin export.
 */
import { eslintRuleStatics } from '../../../statics/eslint-rule/eslint-rule-statics';
import { typescriptEslintRuleStatics } from '../../../statics/typescript-eslint-rule/typescript-eslint-rule-statics';
import { jestRuleStatics } from '../../../statics/jest-rule/jest-rule-statics';
import {
  dungeonmasterRuleEnforceOnStatics,
  gatewayLocationsStatics,
} from '@dungeonmaster/shared/statics';
import type { TSESLint } from '#gateway/npm/typescript-eslint__utils';
import typescriptEslintPlugin from '#gateway/npm/typescript-eslint__eslint-plugin';
import eslintPluginJest from '#gateway/npm/eslint-plugin-jest';
// Namespace import, not default: the gateway wrapper re-exports this package via `export *`,
// which never forwards a `default` binding. At runtime the compiled `export *` still copies the
// real package's `configs`/`rules`/`utils` properties onto the wrapper regardless, so the
// namespace object here holds the same shape the old adapter's default import produced.
import * as eslintPluginEslintComments from '#gateway/npm/eslint-plugin-eslint-comments';
import { eslintConflictResolverTransformer } from '../../../transformers/eslint-conflict-resolver/eslint-conflict-resolver-transformer';
import type { GatewayLintConfig } from '@dungeonmaster/shared/contracts';

type DeepWritable<T> = T extends object ? { -readonly [K in keyof T]: DeepWritable<T[K]> } : T;

export const configDungeonmasterBroker = ({
  forTesting = false,
  gatewayLintConfig = {},
  workspacePackageNames = [],
}: {
  forTesting?: boolean;
  gatewayLintConfig?: GatewayLintConfig;
  // Read ONCE by the CALLER (eslint.config.js, via configWorkspacePackageNamesBroker) from the
  // workspaces root's own `workspaces` globs — ban-workspace-export-mocks' only rule option, so the
  // rule itself reads no file. Defaults to `[]` so calling this broker with no argument (every
  // existing test, every other consumer) still returns a config, with the rule reporting nothing.
  workspacePackageNames?: string[];
} = {}): {
  typescript: TSESLint.FlatConfig.Config;
  test: TSESLint.FlatConfig.Config;
  gateway: TSESLint.FlatConfig.Config;
  fileOverrides: TSESLint.FlatConfig.Config[];
  ruleEnforceOn: typeof dungeonmasterRuleEnforceOnStatics;
} => {
  // Build base configs
  const eslintConfig: TSESLint.FlatConfig.Config = {
    plugins: {},
    rules: {
      ...(eslintRuleStatics.rules as unknown as DeepWritable<typeof eslintRuleStatics.rules>),
      ...(forTesting ? { 'max-depth': 'off' } : {}),
    },
  };

  const baseTypescriptConfig: TSESLint.FlatConfig.Config = {
    plugins: {
      ['@typescript-eslint']: typescriptEslintPlugin,
    },
    rules: {
      ...(typescriptEslintRuleStatics.rules as unknown as DeepWritable<
        typeof typescriptEslintRuleStatics.rules
      >),
      ...(forTesting
        ? {
            '@typescript-eslint/no-magic-numbers': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
          }
        : {}),
    },
  };

  // Merge eslint and typescript with conflict resolution
  const mergedConfig = eslintConflictResolverTransformer({
    reference: eslintConfig,
    overrides: [baseTypescriptConfig],
  });

  // Dungeonmaster custom rules - shared by both typescript and test configs
  const dungeonmasterCustomRules = {
    'eslint-comments/no-unlimited-disable': 'error',
    'eslint-comments/no-use': ['error', { allow: [] }],
    '@dungeonmaster/ban-adhoc-types': 'error',
    '@dungeonmaster/enforce-contract-usage-in-tests': 'error',
    '@dungeonmaster/ban-jest-mock-in-tests': 'error',
    '@dungeonmaster/enforce-file-metadata': 'error',
    '@dungeonmaster/enforce-folder-return-types': 'error',
    '@dungeonmaster/enforce-hydration-recipes-structure': 'error',
    '@dungeonmaster/enforce-implementation-colocation': 'error',
    '@dungeonmaster/enforce-import-dependencies': 'error',
    '@dungeonmaster/enforce-jest-mocked-usage': 'error',
    '@dungeonmaster/enforce-magic-arrays': 'error',
    '@dungeonmaster/enforce-object-destructuring-params': 'error',
    '@dungeonmaster/enforce-optional-guard-params': 'error',
    '@dungeonmaster/enforce-project-structure': 'error',
    '@dungeonmaster/enforce-proxy-child-creation': 'error',
    '@dungeonmaster/enforce-proxy-patterns': 'error',
    '@dungeonmaster/enforce-regex-usage': 'error',
    '@dungeonmaster/enforce-stub-patterns': 'error',
    '@dungeonmaster/enforce-stub-usage': 'error',
    '@dungeonmaster/enforce-test-colocation': 'error',
    '@dungeonmaster/enforce-test-creation-of-proxy': 'error',
    '@dungeonmaster/enforce-test-proxy-imports': 'error',
    '@dungeonmaster/forbid-non-exported-functions': 'error',
    '@dungeonmaster/forbid-todo-skip': 'error',
    '@dungeonmaster/forbid-type-reexport': 'error',
    '@dungeonmaster/jest-mocked-must-import': 'error',
    '@dungeonmaster/no-multiple-property-assertions': 'error',
    '@dungeonmaster/no-mutable-state-in-proxy-factory': 'error',
    '@dungeonmaster/require-contract-validation': 'error',
    '@dungeonmaster/ban-fetch-in-proxies': 'error',
    '@dungeonmaster/ban-silent-catch': 'error',
    '@dungeonmaster/ban-startup-branching': 'error',
    '@dungeonmaster/enforce-harness-patterns': 'error',
    '@dungeonmaster/ban-node-builtins-in-test-scenarios': 'error',
    '@dungeonmaster/ban-inline-helpers-in-test-scenarios': 'error',
    '@dungeonmaster/ban-wait-for-timeout': 'error',
    '@dungeonmaster/ban-page-route-in-e2e': 'error',
    '@dungeonmaster/enforce-e2e-base-import': 'error',
    '@dungeonmaster/ban-not-to-throw': 'error',
    '@dungeonmaster/ban-weak-existence-matchers': 'error',
    '@dungeonmaster/ban-typeof-assertions': 'error',
    '@dungeonmaster/enforce-test-name-prefix': 'error',
    '@dungeonmaster/ban-unanchored-to-match': 'error',
    '@dungeonmaster/enforce-testid-queries': 'error',
    '@dungeonmaster/ban-playwright-evaluate-for-styles': 'error',
    '@dungeonmaster/ban-playwright-extract-then-assert': 'error',
    '@dungeonmaster/ban-jest-mock-in-proxies': 'error',
    '@dungeonmaster/ban-negated-matchers': 'error',
    '@dungeonmaster/ban-tautological-assertions': 'error',
    '@dungeonmaster/ban-object-keys-in-expect': 'error',
    '@dungeonmaster/ban-string-includes-in-expect': 'error',
    '@dungeonmaster/ban-weak-asymmetric-matchers': 'error',
    '@dungeonmaster/no-bare-process-cwd': 'error',
    '@dungeonmaster/ban-reflect-outside-guards': 'error',
    '@dungeonmaster/ban-require-in-source': 'error',
    '@dungeonmaster/ban-unknown-payload-in-discriminated-union': 'error',
    '@dungeonmaster/require-validation-on-untyped-property-access': 'error',
    '@dungeonmaster/enforce-proxy-param-binding': 'error',
    '@dungeonmaster/ban-flattened-contract-params': 'error',
    '@dungeonmaster/ban-anonymous-jsx-in-map': 'error',
    '@dungeonmaster/ban-jsx-outside-widgets-and-flows': 'error',
    '@dungeonmaster/ban-dom-handles-in-ingredients': 'error',
    '@dungeonmaster/ban-nondeterminism-in-ingredients': 'error',
    '@dungeonmaster/gateway-dependency-declared': 'error',
    // BR C9: a z.object(...) field holding an outside package's type reuses the gateway's
    // #Gateway-branded schema, never a direct z.custom/z.instanceof — registered at 'error'
    // directly (not 'off'-then-scan): the whole-repo scan this item ran found nothing to migrate.
    '@dungeonmaster/enforce-gateway-schema-fields': 'error',
    // BR C3: a type predicate may narrow to a library type, never to one of our contract types or
    // an indexed type off one — B17. The whole-repo scan reads 0 in every package.
    '@dungeonmaster/ban-contract-type-predicates': 'error',
    // The three gateway config-key rules share ONE rule option — the `gatewayLintConfig` parameter
    // the CALLER read once from `.dungeonmaster.json`, so a rule itself never reads a file for it.
    '@dungeonmaster/ban-gateway-export': ['error', gatewayLintConfig],
    '@dungeonmaster/enforce-gateway-restricted-to': ['error', gatewayLintConfig],
    // Reads OTHER files (the gateway's own source, the workspace root's package.json), so it is not
    // 'pre-edit'-eligible — it self-gates on dungeonmaster-config-contract.ts, the one file that owns
    // this shape, rather than reporting the same repo-wide check once per linted file.
    '@dungeonmaster/enforce-gateway-config-names-exist': ['error', gatewayLintConfig],
    // T04 (scrolls/brands-gateways-epic/items/t04-workspace-export-mocks-ban.md): the whole-repo
    // scan reads 0 in every package.
    '@dungeonmaster/ban-workspace-export-mocks': ['error', { workspacePackageNames }],
    // Ready — measured against every non-gateway package in scrolls/gateway-build/lint-measurements.md
    // — and turns on once callers migrate (migration order step 3 in scrolls/adapters-to-one-place.md).
    '@dungeonmaster/raw-import-ban': 'error',
    // Ready — same measurement, same migration-order step 3 gate as raw-import-ban above.
    '@dungeonmaster/platform-globals-ban': 'error',
    // Ready — same measurement, same migration-order step 3 gate as raw-import-ban above.
    '@dungeonmaster/bin-program-spawn-ban': 'error',
    // R1: reads every workspace package once to index which contracts production code parses, so it
    // is a ward-only rule, not an editor one. Off here; the repo's lint pass turns it on.
    '@dungeonmaster/require-contract-parse': 'off',
    // R9: an object contract name declared by two workspace packages. Ward-only (reads every package).
    // Off until W10: scalar duplicates are not scanned, and the object duplicates go in wave W2.
    '@dungeonmaster/enforce-unique-contract-names': 'off',
    // R8: a key or parameter named for another owner's field reuses that field (`Quest['id']`,
    // `questContract.shape.id`), with an autofix. Ward-only (reads every package). Off until W3 has
    // moved the owned-id parameters: it flags every plain-string `questId` today.
    '@dungeonmaster/enforce-owner-field-reuse': 'off',
    // R2: the syntax half of the brand rules (B1, B2, B3), with an autofix that writes the derived
    // text. Off until the brand migration has branded every contract: it flags every object contract
    // that has no brand yet. Reads only the linted file, so it is tagged 'pre-edit'.
    '@dungeonmaster/require-object-contract-brands': 'off',
    // T05 (scrolls/brands-gateways-epic/items/t05-proxy-catch-all-and-invented-failures.md): a proxy
    // constructor stages no catch-all default, and a test or proxy never authors an outside failure
    // inline. The one file-scoped `off` is in eslint.config.js (EPIC.md concession 13).
    '@dungeonmaster/ban-proxy-catch-all-defaults': 'error',
    '@dungeonmaster/ban-invented-failures': 'error',
    // R3 (scrolls/brands-gateways-epic/items/b14-type-alias-and-adhoc-type-rules.md): B5 and C2's
    // alias refusals. Off until the aliases it flags are migrated. `ban-adhoc-types` above takes the
    // B9 half as its `checkModuleLevelShapes` option, also off, so it keeps its bare 'error'.
    '@dungeonmaster/ban-type-aliases': 'off',
    // 3.3-R (items/b03-package-exports-and-per-file-test-imports.md): a stub or proxy imported or
    // re-exported by a file that is not test support, a production barrel included. The whole-repo
    // scan reads 0 in every package but `testing`, whose `src/index.ts` ships stubs on purpose and
    // carries a file-scoped `off` in eslint.config.js. Reads only the linted file: 'pre-edit'.
    '@dungeonmaster/ban-test-support-in-production': 'error',
    // R4 (items/b13-owner-field-reuse.md): an object contract holding a child whole beside the child's
    // id. Off until B15 removes the join ids it flags.
    '@dungeonmaster/ban-join-id-beside-child': 'off',
    // Same T05 item. Needs the type checker (fn's real signature), the same ward-only gate as
    // raw-import-ban and platform-globals-ban above — so it carries no entry in
    // dungeonmasterRuleEnforceOnStatics and is listed in WARD_ONLY_TYPE_CHECKED_RULES instead.
    '@dungeonmaster/ban-proxy-empty-called-with': 'error',
    // Disable @typescript-eslint/no-require-imports (replaced by require-contract-validation)
    '@typescript-eslint/no-require-imports': 'off',
    /**
     * This rule is problematic with checking key of object
     * None of these narrows the key, so super annoying
     *
     * export const folderConfigTransformer = ({
     *   folderType,
     * }: {
     *   folderType: string;
     * }): FolderConfig | undefined => {
     *   if (!Object.hasOwn(folderConfigStatics, folderType)) {
     *     return undefined;
     *   }
     *
     *   if (!Object.keys(folderConfigStatics).includes(folderType)) {
     *     return undefined;
     *   }
     *
     *   return folderConfigStatics[folderType];
     * };
     */
    '@typescript-eslint/no-unsafe-return': 'off',
  } as const;

  const typescriptConfig: TSESLint.FlatConfig.Config = {
    plugins: {
      ...mergedConfig.plugins,
      'eslint-comments': eslintPluginEslintComments,
    },
    rules: {
      ...mergedConfig.rules,
      ...(dungeonmasterCustomRules as unknown as DeepWritable<typeof dungeonmasterCustomRules>),
    },
  };

  // The gateway carve-out (packages/{npm,node,browser,bin}/src/**): a re-scoped, POSITIVE rule
  // set, never a `rules: {…: 'off'}` overlay. Built by OMITTING, from dungeonmasterCustomRules,
  // only the handful whose model cannot fit the gateway's shape at all — see
  // scrolls/gateway-build/lint-plan.md, "Decisions made while building", for the one-line reason
  // behind each omission. Every other rule — the file header, no silent catch, the
  // typescript-eslint set, forbid-type-reexport, and everything else — still applies unchanged.
  //
  // enforce-stub-usage is NOT in this list even though the gateway structurally can't satisfy it:
  // the TEST rule block (dungeonmasterCustomRules shared with testConfig) is not carved out by
  // file glob, so a gateway `.test.ts` still needs the rule to recognize the gateway on its own —
  // its own file-gate calls isGatewayFileGuard directly, covering implementation AND test with one
  // mechanism, so the config-level omission here would be redundant.
  const {
    '@dungeonmaster/enforce-project-structure': _gatewayOmitEnforceProjectStructure,
    '@dungeonmaster/enforce-object-destructuring-params':
      _gatewayOmitEnforceObjectDestructuringParams,
    '@dungeonmaster/enforce-proxy-child-creation': _gatewayOmitEnforceProxyChildCreation,
    '@dungeonmaster/enforce-stub-patterns': _gatewayOmitEnforceStubPatterns,
    '@dungeonmaster/ban-adhoc-types': _gatewayOmitBanAdhocTypes,
    // gateway-colocation holds the gateway's own version: a wrapper needs a test and a proxy, a
    // barrel needs a test, and a file declaring only types needs neither.
    '@dungeonmaster/enforce-implementation-colocation': _gatewayOmitEnforceImplementationColocation,
    ...gatewayCustomRules
  } = dungeonmasterCustomRules;

  // ESLint's own flat-config resolver treats a `files` entry ending in bare `/**` (or `/*`) as
  // a "universal" pattern: such a config only applies to a file when ANOTHER matching config
  // also has an extension-specific pattern for it — otherwise the file resolves to NO config at
  // all (silently unlintable), the same trap `ignores` on the main TS block hits if the gateway
  // block that is meant to pick the file back up is itself bare `/**`. Appending `/*.ts` keeps
  // the same directories while giving ESLint a concrete extension to match on.
  const gatewayFiles = gatewayLocationsStatics.packageGlobs.map((glob) => `${glob}/*.ts`);

  const gatewayConfig: TSESLint.FlatConfig.Config = {
    files: gatewayFiles,
    plugins: {
      ...mergedConfig.plugins,
      'eslint-comments': eslintPluginEslintComments,
    },
    rules: {
      ...mergedConfig.rules,
      ...(gatewayCustomRules as unknown as DeepWritable<typeof gatewayCustomRules>),
      // Gateway shape rules: these guard the gateway's own layout and colocation, so they only
      // ever apply inside this carve-out, never the main workspace block.
      '@dungeonmaster/gateway-import-boundary': 'error',
      // requireStub: true — every gateway subpath barrel now ships at least one .stub.ts (G18).
      '@dungeonmaster/gateway-colocation': ['error', { requireStub: true }],
      '@dungeonmaster/gateway-layout': 'error',
      // Needs the type checker (project: true, already set for this carve-out below) to tell a
      // function's own type parameter apart from a real declared type — G15.
      '@dungeonmaster/gateway-return-unknown-not-caller-type': 'error',
      // BR C9: no bare z.custom<T>(), a schema's .brand<'…'>() text is derived not chosen, and no
      // two gateway modules export a same-named type — G20.
      '@dungeonmaster/gateway-schema-brand': 'error',
    },
  };

  const testConfig: TSESLint.FlatConfig.Config = {
    plugins: {
      ...mergedConfig.plugins,
      'eslint-comments': eslintPluginEslintComments,
      ...(forTesting ? { jest: eslintPluginJest } : {}),
    },
    rules: {
      ...mergedConfig.rules,
      ...(forTesting
        ? (jestRuleStatics.rules as unknown as DeepWritable<typeof jestRuleStatics.rules>)
        : {}),
      ...(dungeonmasterCustomRules as unknown as DeepWritable<typeof dungeonmasterCustomRules>),
      // Tests have to do a bunch of sad path edge cases so these aren't helpful
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-type-assertion': 'off',
      // It doesnt matter if this happens in tests
      '@typescript-eslint/no-base-to-string': 'off',
    },
  };

  // Proxy files need to use type assertions for mock compatibility
  const proxyOverrides: TSESLint.FlatConfig.Config = {
    files: ['**/*.proxy.ts', '**/*.proxy.tsx'],
    rules: {
      '@typescript-eslint/no-unsafe-type-assertion': 'off',
    },
  };

  // Stub files need to use primitives and magic numbers for type conversion
  const stubOverride: TSESLint.FlatConfig.Config = {
    files: ['**/*.stub.ts', '**/*.stub.tsx'],
    rules: {
      '@typescript-eslint/no-magic-numbers': 'off',
      // // So that we can spread props as a whole object
      // '@dungeonmaster/enforce-object-destructuring-params': 'off',
    },
  };

  const integrationOverrides: TSESLint.FlatConfig.Config = {
    files: ['**/*.integration.test.ts', '**/*.integration.test.tsx'],
    rules: {
      'jest/max-expects': 'off', // int tests need more flow asserts
    },
  };

  // Package-meta integration tests sit directly in src/ (not in a domain subfolder): they
  // exercise the package as a whole (loading the built plugin, reading rule source files,
  // spinning up tmp environments), so they legitimately use node builtins + module-level
  // helpers and have no single colocated implementation companion.
  const packageMetaIntegrationOverrides: TSESLint.FlatConfig.Config = {
    files: ['**/src/*.integration.test.ts', '**/src/*.integration.test.tsx'],
    rules: {
      '@dungeonmaster/enforce-test-creation-of-proxy': 'off',
      '@dungeonmaster/enforce-test-colocation': 'off',
      '@dungeonmaster/require-contract-validation': 'off',
      '@dungeonmaster/ban-node-builtins-in-test-scenarios': 'off',
      '@dungeonmaster/ban-inline-helpers-in-test-scenarios': 'off',
    },
  };

  const e2eOverrides: TSESLint.FlatConfig.Config = {
    files: ['**/*.e2e.test.ts', '**/*.e2e.test.tsx'],
    rules: {
      'jest/max-expects': 'off',
      '@dungeonmaster/enforce-test-creation-of-proxy': 'off',
      '@dungeonmaster/enforce-test-colocation': 'off',
      '@dungeonmaster/require-contract-validation': 'off',
    },
  };

  const startupTestOverrides: TSESLint.FlatConfig.Config = {
    files: ['**/*.e2e.test.ts', '**/*.integration.test.ts'],
    rules: {
      'jest/no-hooks': 'off',
      '@typescript-eslint/init-declarations': 'off',
    },
  };

  // Startup files use && for conditional side effects (ban-startup-branching provides the real protection)
  const startupShortCircuitOverrides: TSESLint.FlatConfig.Config = {
    files: ['**/startup/start-*.ts'],
    ignores: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true }],
    },
  };

  // Playwright e2e files — relax rules that conflict with Playwright's test API.
  // isTestFileGuard matches *.e2e.ts, so test-scoped @dungeonmaster rules fire on e2e files.
  const specOverrides: TSESLint.FlatConfig.Config = {
    files: ['**/*.e2e.ts'],
    rules: {
      // Jest API conflicts — Playwright uses test() not it(), has own expect/hooks/describe
      'jest/no-hooks': 'off',
      'jest/require-hook': 'off',
      'jest/expect-expect': 'off',
      'jest/valid-expect': 'off',
      'jest/max-expects': 'off',
      'jest/require-top-level-describe': 'off',
      'jest/consistent-test-it': 'off',
      '@typescript-eslint/init-declarations': 'off',
      // Proxy rules — specs use harnesses, not proxies
      '@dungeonmaster/enforce-test-creation-of-proxy': 'off',
      '@dungeonmaster/enforce-test-proxy-imports': 'off',
      // Colocation — e2e files colocate with the entry flow they test, not a single impl companion
      '@dungeonmaster/enforce-test-colocation': 'off',
      // Stubs — specs can use inline test data, not everything needs a stub
      '@dungeonmaster/enforce-stub-usage': 'off',
      // Jest mock — specs don't use jest.mock
      '@dungeonmaster/ban-jest-mock-in-tests': 'off',
      // Import deps — e2e specs are TEST files colocated under flows/<route>, not flow
      // modules. They legitimately reach for node builtins (crypto) to mint unique test
      // data; the flows/-can't-import-external rule targets shipped flow code, not specs.
      '@dungeonmaster/enforce-import-dependencies': 'off',
      // Return types — Playwright test()/page-eval callbacks are inline arrow throwaways;
      // explicit return annotations add noise without value in spec assertions.
      '@typescript-eslint/explicit-function-return-type': 'off',
      // Magic numbers — specs assert literal HTTP status codes (200) and row/index counts
      // inline; extracting every literal to a named const harms spec readability.
      '@typescript-eslint/no-magic-numbers': 'off',
      // Type conversion — String()/Number() coercions over Playwright's loosely-typed
      // handles are intentional defensive normalization, not redundant in spec context.
      '@typescript-eslint/no-unnecessary-type-conversion': 'off',
      // Unsafe any family — page.evaluate() and HTTP harness responses return `any`;
      // these are the same relaxations the repo grants other test files, since specs
      // read untyped browser/harness payloads at runtime.
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  };

  // Harness files — not matched by isTestFileGuard (*.harness.ts has no .test/.spec suffix),
  // so test-scoped @dungeonmaster rules already skip them. Only jest rules need overrides
  // because the jest plugin config includes *.harness.ts in its files pattern.
  const harnessOverrides: TSESLint.FlatConfig.Config = {
    files: ['**/*.harness.ts'],
    rules: {
      // Harnesses register afterEach/beforeEach internally — lifecycle ownership pattern
      'jest/no-hooks': 'off',
      '@typescript-eslint/init-declarations': 'off',
      // Harness factory body has statements outside hooks (state tracking, imports)
      'jest/require-hook': 'off',
    },
  };

  return {
    typescript: typescriptConfig,
    test: testConfig,
    gateway: gatewayConfig,
    fileOverrides: [
      proxyOverrides,
      stubOverride,
      integrationOverrides,
      packageMetaIntegrationOverrides,
      e2eOverrides,
      startupTestOverrides,
      startupShortCircuitOverrides,
      specOverrides,
      harnessOverrides,
    ],
    ruleEnforceOn: dungeonmasterRuleEnforceOnStatics,
  };
};
