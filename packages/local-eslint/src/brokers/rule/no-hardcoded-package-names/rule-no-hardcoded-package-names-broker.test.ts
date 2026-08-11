import { ruleNoHardcodedPackageNamesBroker } from './rule-no-hardcoded-package-names-broker';
import { eslintRuleTesterAdapter } from '@dungeonmaster/eslint-plugin';

const ruleTester = eslintRuleTesterAdapter();

// Virtual fixture paths — RuleTester does NOT read these off disk; it only uses them as the
// "filename" key on each test case so path-based allowlist logic works.
const sharedBrokerFixture =
  '/repo/packages/shared/src/brokers/architecture/edge-graph/http-edges-layer-broker.ts';
const mcpDocsBrokerFixture =
  '/repo/packages/mcp/src/brokers/architecture/testing-patterns/architecture-testing-patterns-broker.ts';
const orchestratorStaticsFixture =
  '/repo/packages/orchestrator/src/statics/flowrider-prompt/flowrider-prompt-statics.ts';
const allowlistedTestFixture = '/repo/packages/shared/src/brokers/foo/foo-broker.test.ts';
const allowlistedRuleOwnedFixture =
  '/repo/packages/local-eslint/src/statics/package-name-literal/package-name-literal-statics.ts';

ruleTester.run('no-hardcoded-package-names', ruleNoHardcodedPackageNamesBroker(), {
  valid: [
    // === COMMENTS: the JSDoc USAGE examples that document a real repo path are exempt ===
    {
      code: [
        '/**',
        ' * PURPOSE: Reads a source file for the architecture view.',
        ' *',
        ' * USAGE:',
        " * architectureSourceReadBroker({ path: 'packages/web/src/widgets/quest-chat' });",
        ' * // Returns the file contents',
        ' */',
        'export const readIt = (): number => 1;',
      ].join('\n'),
      filename: sharedBrokerFixture,
    },
    {
      code: [
        '// The Playwright config lives at packages/web/playwright.config.ts in this repo.',
        'export const readIt = (): number => 1;',
      ].join('\n'),
      filename: sharedBrokerFixture,
    },
    // === PRODUCTION: a package name with no frontend/backend role is not this rule's business ===
    {
      code: "const staticsDir = 'packages/shared/src/statics';",
      filename: sharedBrokerFixture,
    },
    // === PRODUCTION: a wildcard workspace glob names no package ===
    {
      code: "const installScripts = 'packages/*/dist/startup/start-install.js';",
      filename: sharedBrokerFixture,
    },
    // === PRODUCTION: a longer sibling directory is not the watched name ===
    {
      code: "const hooksRoot = 'packages/webhooks/src';",
      filename: sharedBrokerFixture,
    },
    // === PRODUCTION: a module specifier is an import, not a path decision ===
    {
      code: "import { thing } from '@dungeonmaster/web';\nexport const use = (): unknown => thing;",
      filename: sharedBrokerFixture,
    },
    // === PRODUCTION: a bare role name as DATA (array member nothing tests against) decides nothing ===
    {
      code: "const kinds = ['web', 'server'];",
      filename: sharedBrokerFixture,
    },
    // === PRODUCTION: an array of role names carried forward as data, never tested against ===
    {
      code: [
        "const declared = ['web', 'server'];",
        'export const render = (): string[] => declared.map((name) => name.toUpperCase());',
      ].join('\n'),
      filename: sharedBrokerFixture,
    },
    // === PRODUCTION: a role name as an object value is a label, not a branch ===
    {
      code: "const labels = { primary: 'web' };",
      filename: sharedBrokerFixture,
    },
    // === PRODUCTION: a role-name key on a config namespace is not a dispatch table ===
    {
      code: "const config = { api: { basePath: '/api' } };",
      filename: sharedBrokerFixture,
    },
    // === PRODUCTION: a prefix scan over unrelated tokens that happen to include a role word ===
    {
      code: [
        "const skipPrefixes = [':', 'api'];",
        'export const keep = ({ segment }: { segment: string }): boolean =>',
        '  skipPrefixes.every((prefix) => !segment.startsWith(prefix));',
      ].join('\n'),
      filename: sharedBrokerFixture,
    },
    // === ALLOWLIST: test files carry real repo paths as fixture data ===
    {
      code: "const root = 'packages/web/src/brokers';",
      filename: allowlistedTestFixture,
    },
    // === ALLOWLIST: the rule's own package has to spell the names out to match them ===
    {
      code: "const allowlist = ['packages/web', 'packages/server'];",
      filename: allowlistedRuleOwnedFixture,
    },
  ],

  invalid: [
    // === SHAPE 1: module-level const initializers holding workspace paths ===
    {
      code: [
        "const SERVER_FLOWS_REL = 'packages/server/src/flows';",
        "const SERVER_STATICS_REL = 'packages/server/src/statics/api-routes/api-routes-statics.ts';",
        "const WEB_BROKERS_REL = 'packages/web/src/brokers';",
        "const WEB_STATICS_REL = 'packages/web/src/statics/web-config/web-config-statics.ts';",
      ].join('\n'),
      filename: sharedBrokerFixture,
      errors: [
        { messageId: 'hardcodedPackagePath', data: { packageName: 'server' } },
        { messageId: 'hardcodedPackagePath', data: { packageName: 'server' } },
        { messageId: 'hardcodedPackagePath', data: { packageName: 'web' } },
        { messageId: 'hardcodedPackagePath', data: { packageName: 'web' } },
      ],
    },
    // === SHAPE 2: a package name baked into agent-facing prose in a docs template literal ===
    {
      code: [
        'const e2eTesting = `**The Playwright config and harnesses live in the UI package.**',
        'The config at packages/web/playwright.config.ts and the harnesses under packages/web/test own the e2e stack.`;',
      ].join('\n'),
      filename: mcpDocsBrokerFixture,
      errors: [{ messageId: 'hardcodedPackagePath', data: { packageName: 'web' } }],
    },
    // === PROSE: one report per distinct name inside a single prompt-statics chunk ===
    {
      code: 'const guidance = `Tag the node with packages/web for the UI half and packages/server for the API half.`;',
      filename: orchestratorStaticsFixture,
      errors: [
        { messageId: 'hardcodedPackagePath', data: { packageName: 'web' } },
        { messageId: 'hardcodedPackagePath', data: { packageName: 'server' } },
      ],
    },
    // === POSITION: object literal member ===
    {
      code: "const config = { uiRoot: 'packages/web' };",
      filename: sharedBrokerFixture,
      errors: [{ messageId: 'hardcodedPackagePath', data: { packageName: 'web' } }],
    },
    // === POSITION: array literal members ===
    {
      code: "const roots = ['packages/web/src', 'packages/server/src'];",
      filename: sharedBrokerFixture,
      errors: [
        { messageId: 'hardcodedPackagePath', data: { packageName: 'web' } },
        { messageId: 'hardcodedPackagePath', data: { packageName: 'server' } },
      ],
    },
    // === POSITION: template literal that feeds a path ===
    {
      code: `const uiRoot = \`\${projectRoot}/packages/web/src/widgets\`;`,
      filename: sharedBrokerFixture,
      errors: [{ messageId: 'hardcodedPackagePath', data: { packageName: 'web' } }],
    },
    // === POSITION: a comment does not excuse the code beside it ===
    {
      code: [
        '// Mirrors packages/web/src/brokers, documented here.',
        "const uiBrokers = 'packages/web/src/brokers';",
      ].join('\n'),
      filename: sharedBrokerFixture,
      errors: [{ messageId: 'hardcodedPackagePath', data: { packageName: 'web' } }],
    },
    // === BRANCH: a bare role name as an equality operand ===
    {
      code: "export const isUi = ({ name }: { name: string }): boolean => name === 'web';",
      filename: sharedBrokerFixture,
      errors: [{ messageId: 'packageNameDiscriminator', data: { packageName: 'web' } }],
    },
    // === BRANCH: a bare role name as a switch case ===
    {
      code: [
        'export const pick = ({ name }: { name: string }): number => {',
        '  switch (name) {',
        "    case 'server':",
        '      return 1;',
        '    default:',
        '      return 0;',
        '  }',
        '};',
      ].join('\n'),
      filename: sharedBrokerFixture,
      errors: [{ messageId: 'packageNameDiscriminator', data: { packageName: 'server' } }],
    },
    // === BRANCH: the set-shaped spelling — a named array the code tests membership against ===
    {
      code: [
        "const UI_PACKAGES = ['web', 'app'];",
        'export const isUi = ({ name }: { name: string }): boolean => UI_PACKAGES.includes(name);',
      ].join('\n'),
      filename: sharedBrokerFixture,
      errors: [
        { messageId: 'packageNameDiscriminator', data: { packageName: 'web' } },
        { messageId: 'packageNameDiscriminator', data: { packageName: 'app' } },
      ],
    },
    // === BRANCH: the same set frozen with `as const`, which is how this repo writes them ===
    {
      code: [
        "const UI_PACKAGES = ['web', 'desktop'] as const;",
        'export const rank = ({ name }: { name: string }): number => UI_PACKAGES.indexOf(name);',
      ].join('\n'),
      filename: sharedBrokerFixture,
      errors: [
        { messageId: 'packageNameDiscriminator', data: { packageName: 'web' } },
        { messageId: 'packageNameDiscriminator', data: { packageName: 'desktop' } },
      ],
    },
    // === BRANCH: an inline set with no binding to trace ===
    {
      code: "export const isBackend = ({ name }: { name: string }): boolean => ['server', 'api'].includes(name);",
      filename: sharedBrokerFixture,
      errors: [
        { messageId: 'packageNameDiscriminator', data: { packageName: 'server' } },
        { messageId: 'packageNameDiscriminator', data: { packageName: 'api' } },
      ],
    },
    // === BRANCH: a Set built out of role names is a membership set by construction ===
    {
      code: [
        "const UI_PACKAGES = new Set(['web', 'client']);",
        'export const isUi = ({ name }: { name: string }): boolean => UI_PACKAGES.has(name);',
      ].join('\n'),
      filename: sharedBrokerFixture,
      errors: [
        { messageId: 'packageNameDiscriminator', data: { packageName: 'web' } },
        { messageId: 'packageNameDiscriminator', data: { packageName: 'client' } },
      ],
    },
    // === SCOPE: an `apps/` workspace layout is the same hardcode as `packages/` ===
    {
      code: "const uiRoot = 'apps/web/src/widgets';",
      filename: sharedBrokerFixture,
      errors: [{ messageId: 'hardcodedPackagePath', data: { packageName: 'web' } }],
    },
    // === SCOPE: a `libs/` workspace layout, likewise ===
    {
      code: "const apiRoot = 'libs/backend/src';",
      filename: sharedBrokerFixture,
      errors: [{ messageId: 'hardcodedPackagePath', data: { packageName: 'backend' } }],
    },
    // === SCOPE: `desktop` names a UI surface, so it is a role name like `web` ===
    {
      code: "const shellRoot = 'packages/desktop/src';",
      filename: sharedBrokerFixture,
      errors: [{ messageId: 'hardcodedPackagePath', data: { packageName: 'desktop' } }],
    },
  ],
});
