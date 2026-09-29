import { ImportDeclarationStub } from '#gateway/npm/typescript-eslint__utils/import-declaration/import-declaration.stub';
import { resolveImportedStaticsLayerBroker } from './resolve-imported-statics-layer-broker';
import { resolveImportedStaticsLayerBrokerProxy } from './resolve-imported-statics-layer-broker.proxy';

const importOf = ({
  source,
  imported,
  local,
  kind = 'named',
}: {
  source: string;
  imported: string;
  local: string;
  kind?: 'named' | 'namespace';
}): ReturnType<typeof ImportDeclarationStub> =>
  ImportDeclarationStub({
    code:
      kind === 'namespace'
        ? `import * as ${local} from '${source}';`
        : `import { ${imported} as ${local} } from '${source}';`,
  });

const FILENAME = '/repo/packages/ward/src/brokers/bundle/build/bundle-build-broker.ts';
const STATICS_PATH = '/repo/packages/ward/src/statics/bundle/bundle-statics.ts';
const STATICS_SOURCE = "export const bundleStatics = {\n  buildCommand: 'npm',\n} as const;\n";

describe('resolveImportedStaticsLayerBroker', () => {
  describe('relative named import', () => {
    it("VALID: {bundleStatics imported from a relative path} => returns the statics file's string", () => {
      const proxy = resolveImportedStaticsLayerBrokerProxy();
      proxy.setupFile({ path: STATICS_PATH, contents: STATICS_SOURCE });
      const moduleBody = [
        importOf({
          source: '../../../statics/bundle/bundle-statics',
          imported: 'bundleStatics',
          local: 'bundleStatics',
        }),
      ];

      expect(
        resolveImportedStaticsLayerBroker({
          objectName: 'bundleStatics',
          propertyName: 'buildCommand',
          moduleBody,
          filename: FILENAME,
        }),
      ).toBe('npm');
    });

    it('VALID: {aliased import} => reads the IMPORTED name out of the file', () => {
      const proxy = resolveImportedStaticsLayerBrokerProxy();
      proxy.setupFile({ path: STATICS_PATH, contents: STATICS_SOURCE });
      const moduleBody = [
        importOf({
          source: '../../../statics/bundle/bundle-statics',
          imported: 'bundleStatics',
          local: 'b',
        }),
      ];

      expect(
        resolveImportedStaticsLayerBroker({
          objectName: 'b',
          propertyName: 'buildCommand',
          moduleBody,
          filename: FILENAME,
        }),
      ).toBe('npm');
    });

    it('VALID: {the path is a folder with an index.ts} => reads the index file', () => {
      const proxy = resolveImportedStaticsLayerBrokerProxy();
      proxy.setupMissing({ path: '/repo/packages/ward/src/statics/bundle.ts' });
      proxy.setupMissing({ path: '/repo/packages/ward/src/statics/bundle.tsx' });
      proxy.setupFile({
        path: '/repo/packages/ward/src/statics/bundle/index.ts',
        contents: STATICS_SOURCE,
      });
      const moduleBody = [
        importOf({
          source: '../../../statics/bundle',
          imported: 'bundleStatics',
          local: 'bundleStatics',
        }),
      ];

      expect(
        resolveImportedStaticsLayerBroker({
          objectName: 'bundleStatics',
          propertyName: 'buildCommand',
          moduleBody,
          filename: FILENAME,
        }),
      ).toBe('npm');
    });
  });

  describe('not resolvable', () => {
    it('EMPTY: {the imported file does not exist} => returns undefined', () => {
      const proxy = resolveImportedStaticsLayerBrokerProxy();
      proxy.setupMissing({ path: STATICS_PATH });
      proxy.setupMissing({ path: STATICS_PATH.replace(/\.ts$/u, '.tsx') });
      proxy.setupMissing({ path: STATICS_PATH.replace(/\.ts$/u, '/index.ts') });
      const moduleBody = [
        importOf({
          source: '../../../statics/bundle/bundle-statics',
          imported: 'bundleStatics',
          local: 'bundleStatics',
        }),
      ];

      expect(
        resolveImportedStaticsLayerBroker({
          objectName: 'bundleStatics',
          propertyName: 'buildCommand',
          moduleBody,
          filename: FILENAME,
        }),
      ).toBe(undefined);
    });

    it('EMPTY: {import from a workspace package, not a relative path} => returns undefined', () => {
      resolveImportedStaticsLayerBrokerProxy();
      const moduleBody = [
        importOf({
          source: '@dungeonmaster/shared/statics',
          imported: 'bundleStatics',
          local: 'bundleStatics',
        }),
      ];

      expect(
        resolveImportedStaticsLayerBroker({
          objectName: 'bundleStatics',
          propertyName: 'buildCommand',
          moduleBody,
          filename: FILENAME,
        }),
      ).toBe(undefined);
    });

    it('EMPTY: {namespace import} => returns undefined', () => {
      resolveImportedStaticsLayerBrokerProxy();
      const moduleBody = [
        importOf({
          source: '../../../statics/bundle/bundle-statics',
          imported: 'bundleStatics',
          local: 'bundleStatics',
          kind: 'namespace',
        }),
      ];

      expect(
        resolveImportedStaticsLayerBroker({
          objectName: 'bundleStatics',
          propertyName: 'buildCommand',
          moduleBody,
          filename: FILENAME,
        }),
      ).toBe(undefined);
    });

    it('EMPTY: {no import names the object} => returns undefined', () => {
      resolveImportedStaticsLayerBrokerProxy();

      expect(
        resolveImportedStaticsLayerBroker({
          objectName: 'bundleStatics',
          propertyName: 'buildCommand',
          moduleBody: [],
          filename: FILENAME,
        }),
      ).toBe(undefined);
    });
  });
});
