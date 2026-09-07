import { FilePathStub, InstallContextStub } from '@dungeonmaster/shared/contracts';

import { CreatePackageRequestStub } from '../../../contracts/create-package-request/create-package-request.stub';
import { PackageJsonRawStub } from '../../../contracts/package-json-raw/package-json-raw.stub';
import { packageScaffoldFilesTransformer } from '../../../transformers/package-scaffold-files/package-scaffold-files-transformer';

import { CliCreatePackageResponder } from './cli-create-package-responder';
import { CliCreatePackageResponderProxy } from './cli-create-package-responder.proxy';

describe('CliCreatePackageResponder', () => {
  it('VALID: {args: --name widgets --type library} => writes files, registers the package, and reports the summary to stdout', async () => {
    const proxy = CliCreatePackageResponderProxy();
    const projectRoot = FilePathStub({ value: '/repo' });
    const packageRoot = FilePathStub({ value: '/repo/packages/widgets' });
    const files = packageScaffoldFilesTransformer({
      request: CreatePackageRequestStub({
        packageName: '@acme/widgets',
        directoryName: 'widgets',
        packageType: 'library',
        packagesDir: 'packages',
      }),
    });

    proxy.setupRootPackageJson({
      projectRoot,
      contents: JSON.stringify(
        PackageJsonRawStub({ dependencies: { '@acme/other-package': '*' } }),
      ),
    });
    proxy.setupTargetMissing({ packageRoot, files });

    const context = InstallContextStub({
      value: { targetProjectRoot: projectRoot, dungeonmasterRoot: '/repo/.dungeonmaster' },
    });

    const result = await CliCreatePackageResponder({
      context,
      args: ['--name', 'widgets', '--type', 'library'],
    });

    expect(result).toStrictEqual({ success: true });
    expect(proxy.getOutput()).toStrictEqual([
      'Scaffolding @acme/widgets at /repo/packages/widgets\n',
      '  package.json\n',
      '  tsconfig.json\n',
      '  tsconfig.build.json\n',
      '  jest.config.js\n',
      '  statics.ts\n',
      '  src/statics/widgets/widgets-statics.ts\n',
      '  src/statics/widgets/widgets-statics.test.ts\n',
      'Wrote 7 files.\n',
      'Registered @acme/widgets in the root package.json.\n',
      'Next steps:\n',
      '  npm install\n',
      '  npm run ward -- -- packages/widgets\n',
    ]);
    expect(proxy.getWrittenFiles().map((file) => file.path)).toStrictEqual([
      '/repo/packages/widgets/package.json',
      '/repo/packages/widgets/tsconfig.json',
      '/repo/packages/widgets/tsconfig.build.json',
      '/repo/packages/widgets/jest.config.js',
      '/repo/packages/widgets/statics.ts',
      '/repo/packages/widgets/src/statics/widgets/widgets-statics.ts',
      '/repo/packages/widgets/src/statics/widgets/widgets-statics.test.ts',
      // packageRegisterBroker's own write to the ROOT package.json — same underlying writeFile
      // mock as the scaffold write, so it shows up in this same recorded list.
      '/repo/package.json',
    ]);
  });

  it('EDGE: {args: --name widgets --type library --dry-run} => prints the plan and writes nothing', async () => {
    const proxy = CliCreatePackageResponderProxy();
    const projectRoot = FilePathStub({ value: '/repo' });

    proxy.setupRootPackageJson({
      projectRoot,
      contents: JSON.stringify(
        PackageJsonRawStub({ dependencies: { '@acme/other-package': '*' } }),
      ),
    });

    const context = InstallContextStub({
      value: { targetProjectRoot: projectRoot, dungeonmasterRoot: '/repo/.dungeonmaster' },
    });

    const result = await CliCreatePackageResponder({
      context,
      args: ['--name', 'widgets', '--type', 'library', '--dry-run'],
    });

    expect(result).toStrictEqual({ success: true });
    expect(proxy.getOutput()).toStrictEqual([
      'Scaffolding @acme/widgets at /repo/packages/widgets\n',
      '  package.json\n',
      '  tsconfig.json\n',
      '  tsconfig.build.json\n',
      '  jest.config.js\n',
      '  statics.ts\n',
      '  src/statics/widgets/widgets-statics.ts\n',
      '  src/statics/widgets/widgets-statics.test.ts\n',
      'Would write 7 files. Nothing was written.\n',
    ]);
    expect(proxy.getWrittenFiles()).toStrictEqual([]);
  });

  it('EDGE: {packageName already in root dependencies} => still writes files but reports it was already registered', async () => {
    const proxy = CliCreatePackageResponderProxy();
    const projectRoot = FilePathStub({ value: '/repo' });
    const packageRoot = FilePathStub({ value: '/repo/packages/widgets' });
    const files = packageScaffoldFilesTransformer({
      request: CreatePackageRequestStub({
        packageName: '@acme/widgets',
        directoryName: 'widgets',
        packageType: 'library',
        packagesDir: 'packages',
      }),
    });

    proxy.setupRootPackageJson({
      projectRoot,
      contents: JSON.stringify(PackageJsonRawStub({ dependencies: { '@acme/widgets': '*' } })),
    });
    proxy.setupTargetMissing({ packageRoot, files });

    const context = InstallContextStub({
      value: { targetProjectRoot: projectRoot, dungeonmasterRoot: '/repo/.dungeonmaster' },
    });

    const result = await CliCreatePackageResponder({
      context,
      args: ['--name', 'widgets', '--type', 'library'],
    });

    expect(result).toStrictEqual({ success: true });
    expect(proxy.getOutput()).toStrictEqual([
      'Scaffolding @acme/widgets at /repo/packages/widgets\n',
      '  package.json\n',
      '  tsconfig.json\n',
      '  tsconfig.build.json\n',
      '  jest.config.js\n',
      '  statics.ts\n',
      '  src/statics/widgets/widgets-statics.ts\n',
      '  src/statics/widgets/widgets-statics.test.ts\n',
      'Wrote 7 files.\n',
      '@acme/widgets was already registered in the root package.json.\n',
      'Next steps:\n',
      '  npm install\n',
      '  npm run ward -- -- packages/widgets\n',
    ]);
  });

  it('VALID: {args: --type frontend-react} => reports the e2e caveat line for an e2e-eligible type', async () => {
    const proxy = CliCreatePackageResponderProxy();
    const projectRoot = FilePathStub({ value: '/repo' });
    const packageRoot = FilePathStub({ value: '/repo/packages/widgets' });
    const files = packageScaffoldFilesTransformer({
      request: CreatePackageRequestStub({
        packageName: '@acme/widgets',
        directoryName: 'widgets',
        packageType: 'frontend-react',
        packagesDir: 'packages',
      }),
    });

    proxy.setupRootPackageJson({
      projectRoot,
      contents: JSON.stringify(
        PackageJsonRawStub({ dependencies: { '@acme/other-package': '*' } }),
      ),
    });
    proxy.setupTargetMissing({ packageRoot, files });

    const context = InstallContextStub({
      value: { targetProjectRoot: projectRoot, dungeonmasterRoot: '/repo/.dungeonmaster' },
    });

    const result = await CliCreatePackageResponder({
      context,
      args: ['--name', 'widgets', '--type', 'frontend-react'],
    });

    expect(result).toStrictEqual({ success: true });
    expect(proxy.getOutput()).toStrictEqual([
      'Scaffolding @acme/widgets at /repo/packages/widgets\n',
      '  package.json\n',
      '  tsconfig.json\n',
      '  tsconfig.build.json\n',
      '  jest.config.js\n',
      '  playwright.config.ts\n',
      '  widgets.ts\n',
      '  src/widgets/widgets-panel/widgets-panel-widget.tsx\n',
      '  src/widgets/widgets-panel/widgets-panel-widget.proxy.tsx\n',
      '  src/widgets/widgets-panel/widgets-panel-widget.test.tsx\n',
      'Wrote 9 files.\n',
      'Registered @acme/widgets in the root package.json.\n',
      'Next steps:\n',
      '  npm install\n',
      '  npm run ward -- -- packages/widgets\n',
      '  ward\'s e2e check stays red until this package adds a "dev:no-watch" script and at least one *.e2e.ts spec.\n',
    ]);
  });
});
