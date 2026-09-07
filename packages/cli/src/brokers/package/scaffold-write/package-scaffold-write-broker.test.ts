import { packageScaffoldWriteBroker } from './package-scaffold-write-broker';
import { packageScaffoldWriteBrokerProxy } from './package-scaffold-write-broker.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { ScaffoldFileStub } from '../../../contracts/scaffold-file/scaffold-file.stub';

describe('packageScaffoldWriteBroker', () => {
  describe('writing scaffold files', () => {
    it('VALID: {files: [package.json]} => writes it under packageRoot and returns its absolute path', async () => {
      const proxy = packageScaffoldWriteBrokerProxy();
      const packageRoot = FilePathStub({ value: '/repo/packages/widget-forge' });
      const files = [ScaffoldFileStub({ relativePath: 'package.json', contents: '{}\n' })];

      proxy.setupTargetMissing({ packageRoot, files });

      const result = await packageScaffoldWriteBroker({ packageRoot, files });

      expect(result).toStrictEqual([
        FilePathStub({ value: '/repo/packages/widget-forge/package.json' }),
      ]);
      expect(proxy.getWrittenFiles()).toStrictEqual([
        {
          path: FilePathStub({ value: '/repo/packages/widget-forge/package.json' }),
          content: '{}\n',
        },
      ]);
    });

    it('VALID: {files: [three files across nested directories]} => writes each under its own parent directory with its exact contents', async () => {
      const proxy = packageScaffoldWriteBrokerProxy();
      const packageRoot = FilePathStub({ value: '/repo/packages/widget-forge' });
      const files = [
        ScaffoldFileStub({ relativePath: 'package.json', contents: '{"name":"widget-forge"}\n' }),
        ScaffoldFileStub({
          relativePath: 'src/widgets/foo-panel/foo-panel-widget.tsx',
          contents: 'export const FooPanelWidget = () => null;\n',
        }),
        ScaffoldFileStub({
          relativePath: 'src/contracts/foo/foo-contract.ts',
          contents: 'export const fooContract = 1;\n',
        }),
      ];

      proxy.setupTargetMissing({ packageRoot, files });

      const result = await packageScaffoldWriteBroker({ packageRoot, files });

      expect(result).toStrictEqual([
        FilePathStub({ value: '/repo/packages/widget-forge/package.json' }),
        FilePathStub({
          value: '/repo/packages/widget-forge/src/widgets/foo-panel/foo-panel-widget.tsx',
        }),
        FilePathStub({ value: '/repo/packages/widget-forge/src/contracts/foo/foo-contract.ts' }),
      ]);
      expect(proxy.getWrittenFiles()).toStrictEqual([
        {
          path: FilePathStub({ value: '/repo/packages/widget-forge/package.json' }),
          content: '{"name":"widget-forge"}\n',
        },
        {
          path: FilePathStub({
            value: '/repo/packages/widget-forge/src/widgets/foo-panel/foo-panel-widget.tsx',
          }),
          content: 'export const FooPanelWidget = () => null;\n',
        },
        {
          path: FilePathStub({
            value: '/repo/packages/widget-forge/src/contracts/foo/foo-contract.ts',
          }),
          content: 'export const fooContract = 1;\n',
        },
      ]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {files: []} => writes nothing and returns an empty array', async () => {
      const proxy = packageScaffoldWriteBrokerProxy();
      const packageRoot = FilePathStub({ value: '/repo/packages/widget-forge' });

      proxy.setupTargetMissing({ packageRoot, files: [] });

      const result = await packageScaffoldWriteBroker({ packageRoot, files: [] });

      expect(result).toStrictEqual([]);
      expect(proxy.getWrittenFiles()).toStrictEqual([]);
    });
  });

  describe('existing target refusal', () => {
    it('ERROR: {packageRoot: already exists} => rejects and writes nothing', async () => {
      const proxy = packageScaffoldWriteBrokerProxy();
      const packageRoot = FilePathStub({ value: '/repo/packages/widget-forge' });
      const files = [ScaffoldFileStub({ relativePath: 'package.json', contents: '{}\n' })];

      proxy.setupTargetExists({ packageRoot });

      await expect(packageScaffoldWriteBroker({ packageRoot, files })).rejects.toThrow(
        /^Cannot scaffold \/repo\/packages\/widget-forge: a package already exists there and this command will not overwrite it\.$/u,
      );
      expect(proxy.getWrittenFiles()).toStrictEqual([]);
    });
  });
});
