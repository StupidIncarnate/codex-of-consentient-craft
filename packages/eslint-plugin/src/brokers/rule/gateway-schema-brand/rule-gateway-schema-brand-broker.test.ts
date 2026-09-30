import { ruleGatewaySchemaBrandBroker } from './rule-gateway-schema-brand-broker';
import { ruleGatewaySchemaBrandBrokerProxy } from './rule-gateway-schema-brand-broker.proxy';
import { ruleTesterHarness } from '../../../../test/harnesses/rule-tester/rule-tester.harness';
import { FileNameStub } from '../../../contracts/file-name/file-name.stub';

const ruleTester = ruleTesterHarness();

const CHILD_PROCESS_SCHEMA_FILE =
  '/repo/packages/@gateway/node/src/child_process/child-process/child-process-schema.ts';
const WALKED_FILE_SCHEMA_FILE =
  '/repo/packages/@gateway/node/src/fs/walk-files-sync/walked-file-schema.ts';
// Directly inside the node package's src/ root — matching the flat, one-file-per-srcDir shape
// buildGatewayTypeDeclarationIndexLayerBrokerProxy's setupSrcDirWithDeclaration stages.
const WALKED_FILE_DECLARATION_FILE = '/repo/packages/@gateway/node/src/walked-file.ts';
const OTHER_WALKED_FILE_DECLARATION_FILE =
  '/repo/packages/@gateway/browser/src/some-subpath/walked-file.ts';

// One shared gateway index across every case: 'WalkedFile' is declared exactly once, at
// WALKED_FILE_DECLARATION_FILE. A case linting that same file sees no OTHER declarer (self-match
// filtered out); a case linting any other file sees exactly one — WALKED_FILE_DECLARATION_FILE.
beforeEach(() => {
  const proxy = ruleGatewaySchemaBrandBrokerProxy();

  // existsSyncProxy (composed inside workspaceRootFindBrokerProxy) ships no address-less
  // catch-all: every ancestor level between each interface-declaring file's directory and the
  // real workspace root needs an explicit false stage.
  proxy.workspaceRoot.setupNoPackageJson({ dir: '/repo/packages/@gateway/node/src' });
  proxy.workspaceRoot.setupNoPackageJson({ dir: '/repo/packages/@gateway/node' });
  proxy.workspaceRoot.setupNoPackageJson({
    dir: '/repo/packages/@gateway/browser/src/some-subpath',
  });
  proxy.workspaceRoot.setupNoPackageJson({ dir: '/repo/packages/@gateway/browser/src' });
  proxy.workspaceRoot.setupNoPackageJson({ dir: '/repo/packages/@gateway/browser' });
  proxy.workspaceRoot.setupNoPackageJson({ dir: '/repo/packages/@gateway' });
  proxy.workspaceRoot.setupNoPackageJson({ dir: '/repo/packages' });
  proxy.workspaceRoot.setupWorkspaceRoot({
    rootDir: '/repo',
    rootPackageJsonName: 'dungeonmaster',
    packageNames: [],
  });
  proxy.typeDeclarationIndex.setupSrcDirMissing({
    srcDir: '/repo/packages/@gateway/npm/src/',
  });
  proxy.typeDeclarationIndex.setupSrcDirWithDeclaration({
    srcDir: '/repo/packages/@gateway/node/src/',
    fileName: FileNameStub({ value: 'walked-file.ts' }),
    filePath: WALKED_FILE_DECLARATION_FILE,
    sourceText: 'export interface WalkedFile {\n  path: string;\n}\n',
  });
  proxy.typeDeclarationIndex.setupSrcDirMissing({
    srcDir: '/repo/packages/@gateway/browser/src/',
  });
  proxy.typeDeclarationIndex.setupSrcDirMissing({
    srcDir: '/repo/packages/@gateway/bin/src/',
  });
});

ruleTester.run('gateway-schema-brand', ruleGatewaySchemaBrandBroker(), {
  valid: [
    // --- z.instanceof, correctly branded ---
    {
      code: "export const childProcessSchema = z.instanceof(ChildProcess).brand<'#GatewayChildProcess'>();",
      filename: CHILD_PROCESS_SCHEMA_FILE,
    },
    // --- z.custom with an inline check function, correctly branded ---
    {
      code: "export const walkedFileSchema = z.custom<WalkedFile>((v) => isWalkedFile(v)).brand<'#GatewayWalkedFile'>();",
      filename: WALKED_FILE_SCHEMA_FILE,
    },
    // --- z.custom with a named function reference passed directly (still a check function) ---
    {
      code: "export const walkedFileSchema = z.custom<WalkedFile>(isWalkedFile).brand<'#GatewayWalkedFile'>();",
      filename: WALKED_FILE_SCHEMA_FILE,
    },
    // --- exported interface, unique across the gateway: the index's only entry IS this file ---
    {
      code: 'export interface WalkedFile {\n  path: string;\n}\n',
      filename: WALKED_FILE_DECLARATION_FILE,
    },
  ],

  invalid: [
    // --- bare z.custom<T>(), no check function ---
    {
      code: 'export const walkedFileSchema = z.custom<WalkedFile>();',
      filename: WALKED_FILE_SCHEMA_FILE,
      errors: [{ messageId: 'bareCustomSchema', data: { typeName: 'WalkedFile' } }],
    },
    // --- z.instanceof, wrong brand text ---
    {
      code: "export const childProcessSchema = z.instanceof(ChildProcess).brand<'#GatewayWrongName'>();",
      filename: CHILD_PROCESS_SCHEMA_FILE,
      errors: [
        {
          messageId: 'wrongBrandText',
          data: { brandText: '#GatewayWrongName', expectedBrandText: '#GatewayChildProcess' },
        },
      ],
    },
    // --- z.custom, wrong brand text ---
    {
      code: "export const walkedFileSchema = z.custom<WalkedFile>((v) => isWalkedFile(v)).brand<'#GatewayWrongName'>();",
      filename: WALKED_FILE_SCHEMA_FILE,
      errors: [
        {
          messageId: 'wrongBrandText',
          data: { brandText: '#GatewayWrongName', expectedBrandText: '#GatewayWalkedFile' },
        },
      ],
    },
    // --- the same interface name declared in two gateway files ---
    {
      code: 'export interface WalkedFile {\n  path: string;\n}\n',
      filename: OTHER_WALKED_FILE_DECLARATION_FILE,
      errors: [
        {
          messageId: 'duplicateTypeName',
          data: { name: 'WalkedFile', otherFile: WALKED_FILE_DECLARATION_FILE },
        },
      ],
    },
  ],
});
