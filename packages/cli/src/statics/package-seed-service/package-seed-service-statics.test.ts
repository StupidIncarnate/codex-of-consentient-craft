import { packageSeedServiceStatics } from './package-seed-service-statics';

describe('packageSeedServiceStatics', () => {
  describe('http-backend', () => {
    it('VALID: {type: http-backend} => carries the exact non-files fields', () => {
      const { files: _files, ...rest } = packageSeedServiceStatics['http-backend'];

      expect(rest).toStrictEqual({
        barrel: {
          fileName: 'adapters.ts',
          exportPaths: ['./src/adapters/hono/app-create/hono-app-create-adapter'],
        },
        dependencies: { hono: '^4.0.0' },
        bin: {},
        compilerOptions: {},
        extraInclude: [],
        buildRootDir: null,
        jestKind: 'node',
        e2eEligible: false,
        exportsDot: false,
      });
    });

    it('VALID: {type: http-backend} => seeds exactly these file paths', () => {
      const paths = packageSeedServiceStatics['http-backend'].files.map((file) => file.path);

      expect(paths).toStrictEqual([
        'src/adapters/hono/app-create/hono-app-create-adapter.ts',
        'src/adapters/hono/app-create/hono-app-create-adapter.proxy.ts',
        'src/adapters/hono/app-create/hono-app-create-adapter.test.ts',
      ]);
    });

    it('VALID: {type: http-backend} => seeds a src/adapters/hono/ file first, which is what the detector keys on', () => {
      const [honoAdapterFile] = packageSeedServiceStatics['http-backend'].files;

      expect(honoAdapterFile.path).toBe('src/adapters/hono/app-create/hono-app-create-adapter.ts');
    });
  });

  describe('mcp-server', () => {
    it('VALID: {type: mcp-server} => carries the exact non-files fields', () => {
      const { files: _files, ...rest } = packageSeedServiceStatics['mcp-server'];

      expect(rest).toStrictEqual({
        barrel: {
          fileName: 'flows.ts',
          exportPaths: ['./src/flows/__NAME__/__NAME__-flow'],
        },
        dependencies: { '__SCOPE__/shared': '*' },
        bin: {},
        compilerOptions: {},
        extraInclude: [],
        buildRootDir: null,
        jestKind: 'node',
        e2eEligible: false,
        exportsDot: false,
      });
    });

    it('VALID: {type: mcp-server} => seeds exactly these file paths', () => {
      const paths = packageSeedServiceStatics['mcp-server'].files.map((file) => file.path);

      expect(paths).toStrictEqual([
        'src/contracts/tool-registration/tool-registration-contract.ts',
        'src/contracts/tool-registration/tool-registration.stub.ts',
        'src/contracts/tool-registration/tool-registration-contract.test.ts',
        'src/flows/__NAME__/__NAME__-flow.ts',
        'src/flows/__NAME__/__NAME__-flow.integration.test.ts',
      ]);
    });

    it('VALID: {type: mcp-server} => the __NAME__-flow.ts file imports ToolRegistration, which is what the detector keys on', () => {
      const [, , , flowFile] = packageSeedServiceStatics['mcp-server'].files;

      expect(flowFile.contents).toMatch(
        /^import type \{ ToolRegistration \} from '\.\.\/\.\.\/contracts\/tool-registration\/tool-registration-contract';$/mu,
      );
    });
  });

  describe('cli-tool', () => {
    it('VALID: {type: cli-tool} => carries the exact non-files fields', () => {
      const { files: _files, ...rest } = packageSeedServiceStatics['cli-tool'];

      expect(rest).toStrictEqual({
        barrel: null,
        dependencies: {},
        bin: { __NAME__: './dist/bin/__NAME__-entry.js' },
        compilerOptions: {},
        extraInclude: ['bin/**/*'],
        buildRootDir: null,
        jestKind: 'node',
        e2eEligible: false,
        exportsDot: true,
      });
    });

    it('VALID: {type: cli-tool} => seeds exactly these file paths', () => {
      const paths = packageSeedServiceStatics['cli-tool'].files.map((file) => file.path);

      expect(paths).toStrictEqual([
        'bin/__NAME__-entry.ts',
        'src/startup/start-__NAME__.ts',
        'src/startup/start-__NAME__.integration.test.ts',
      ]);
    });

    it('VALID: {type: cli-tool} => the bin/__NAME__-entry.ts file contains the literal text process.argv, which is what the detector keys on', () => {
      const [binFile] = packageSeedServiceStatics['cli-tool'].files;

      expect(binFile.contents).toMatch(
        /^ {2}const \[command\] = process\.argv\.slice\(COMMAND_ARG_START_INDEX\);$/mu,
      );
    });
  });
});
