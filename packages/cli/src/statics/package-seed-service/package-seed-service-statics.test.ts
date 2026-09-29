import { packageSeedServiceStatics } from './package-seed-service-statics';

describe('packageSeedServiceStatics', () => {
  describe('http-backend', () => {
    it('VALID: {type: http-backend} => carries the exact non-files fields', () => {
      const { files: _files, ...rest } = packageSeedServiceStatics['http-backend'];

      expect(rest).toStrictEqual({
        barrel: {
          fileName: 'flows.ts',
          exportPaths: ['./src/flows/__NAME__/__NAME__-flow'],
        },
        dependencies: { hono: '^4.0.0' },
        devDependencies: {},
        bin: {},
        compilerOptions: {},
        extraInclude: [],
        buildRootDir: null,
        jestKind: 'node',
        e2eEligible: false,
        exportsDot: false,
        needsMswTransform: false,
      });
    });

    it('VALID: {type: http-backend} => seeds exactly these file paths', () => {
      const paths = packageSeedServiceStatics['http-backend'].files.map((file) => file.path);

      expect(paths).toStrictEqual([
        'src/statics/route/route-statics.ts',
        'src/statics/route/route-statics.test.ts',
        'src/flows/__NAME__/__NAME__-flow.ts',
        'src/flows/__NAME__/__NAME__-flow.integration.test.ts',
      ]);
    });

    it('VALID: {type: http-backend} => no seeded file lives under an adapters folder', () => {
      const adapterPaths = packageSeedServiceStatics['http-backend'].files
        .map((file) => file.path)
        .filter((path) => path.includes('adapters/'));

      expect(adapterPaths).toStrictEqual([]);
    });

    it('VALID: {type: http-backend} => no seeded file imports an npm package or the shared package', () => {
      const importingPaths = packageSeedServiceStatics['http-backend'].files
        .filter((file) => /from '(?!\.)/u.test(file.contents))
        .map((file) => file.path);

      expect(importingPaths).toStrictEqual([]);
    });

    it('VALID: {type: http-backend} => the __NAME__-flow.ts file returns the route table under src/flows/, which the detector keys on beside the declared hono dependency', () => {
      const [, , flowFile] = packageSeedServiceStatics['http-backend'].files;

      expect(flowFile.contents).toMatch(
        /^export const __PASCAL__Flow = \(\): typeof routeStatics\.routes => routeStatics\.routes;$/mu,
      );
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
        devDependencies: {},
        bin: {},
        compilerOptions: {},
        extraInclude: [],
        buildRootDir: null,
        jestKind: 'node',
        e2eEligible: false,
        exportsDot: false,
        needsMswTransform: true,
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
        devDependencies: {},
        bin: { __NAME__: './dist/bin/__NAME__-entry.js' },
        compilerOptions: {},
        extraInclude: ['bin/**/*'],
        buildRootDir: null,
        jestKind: 'node',
        e2eEligible: false,
        exportsDot: true,
        needsMswTransform: true,
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
