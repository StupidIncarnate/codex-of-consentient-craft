import { ruleBanSelfLocatedRepoLookupBroker } from './rule-ban-self-located-repo-lookup-broker';
import { ruleTesterHarness } from '@dungeonmaster/eslint-plugin/rule-tester.harness';

const ruleTester = ruleTesterHarness();

const brokerFile = '/repo/packages/eslint-plugin/src/brokers/rule/x/rule-x-broker.ts';

const selfLocatedError = ({ resolver }: { resolver: string }): unknown => ({
  messageId: 'selfLocatedLookup',
  data: { resolver },
});

ruleTester.run('ban-self-located-repo-lookup', ruleBanSelfLocatedRepoLookupBroker(), {
  valid: [
    // The linted file's directory is the consumer-side input
    {
      code: 'repoScopeResolveBroker({ startDir: dirname(filename) });',
      filename: brokerFile,
    },
    // A variable built from the input, not from this module's location
    {
      code: 'const fileDir = dirname(filename); repoScopeResolveBroker({ startDir: fileDir });',
      filename: brokerFile,
    },
    // The consumer's own cwd in a CLI entry point
    {
      code: "cwdResolveBroker({ startPath: cwd(), kind: 'repo-root' });",
      filename: brokerFile,
    },
    // `project-root` asks for this module's own package, which is allowed
    {
      code: "cwdResolveBroker({ startPath: __dirname, kind: 'project-root' });",
      filename: brokerFile,
    },
    // A call that is not a repo resolver may use this module's location freely
    {
      code: "const templatesDir = resolve(__dirname, '../templates'); readdirSync(templatesDir);",
      filename: brokerFile,
    },
    // `__dirname` as an object key is a label, not a value
    {
      code: 'workspaceRootFindBroker({ startDir: paths.__dirname });',
      filename: brokerFile,
    },
    // A method of the same name on another object is a different function
    {
      code: 'resolvers.repoScopeResolveBroker({ startDir: __dirname });',
      filename: brokerFile,
    },
  ],
  invalid: [
    {
      code: 'repoScopeResolveBroker({ startDir: __dirname });',
      filename: brokerFile,
      errors: [selfLocatedError({ resolver: 'repoScopeResolveBroker' })],
    },
    {
      code: 'configGatewayLintConfigBroker({ startDir: __dirname });',
      filename: brokerFile,
      errors: [selfLocatedError({ resolver: 'configGatewayLintConfigBroker' })],
    },
    {
      code: 'configWorkspacePackageNamesBroker({ startDir: __dirname });',
      filename: brokerFile,
      errors: [selfLocatedError({ resolver: 'configWorkspacePackageNamesBroker' })],
    },
    // Derived from __filename through a same-file variable
    {
      code: 'const ownDir = dirname(__filename); workspaceRootFindBroker({ startDir: ownDir });',
      filename: brokerFile,
      errors: [selfLocatedError({ resolver: 'workspaceRootFindBroker' })],
    },
    // A variable declared after the call still counts
    {
      code: "gatewayLintConfigReadBroker({ repoRoot: root }); const root = resolve(__dirname, '../..');",
      filename: brokerFile,
      errors: [selfLocatedError({ resolver: 'gatewayLintConfigReadBroker' })],
    },
    // import.meta.url in an ES module
    {
      code: 'portResolveBroker({ startDir: fileURLToPath(new URL(".", import.meta.url)) });',
      filename: brokerFile,
      errors: [selfLocatedError({ resolver: 'portResolveBroker' })],
    },
    // Any kind other than project-root names a repo, so this module's location is wrong there
    {
      code: "cwdResolveBroker({ startPath: __dirname, kind: 'repo-root' });",
      filename: brokerFile,
      errors: [selfLocatedError({ resolver: 'cwdResolveBroker' })],
    },
    {
      code: 'configRootFindBroker({ startPath: __dirname });',
      filename: brokerFile,
      errors: [selfLocatedError({ resolver: 'configRootFindBroker' })],
    },
    {
      code: 'resolveGatewayScopeLayerBroker({ filename: __filename });',
      filename: brokerFile,
      errors: [selfLocatedError({ resolver: 'resolveGatewayScopeLayerBroker' })],
    },
  ],
});
