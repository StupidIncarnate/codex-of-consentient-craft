import { GatewayNpmDependencyStub } from '../../../contracts/gateway-npm-dependency/gateway-npm-dependency.stub';
import { PackageJsonStub } from '@dungeonmaster/shared/contracts/package-json/package-json.stub';
import { ownCopyGateLayerBroker } from './own-copy-gate-layer-broker';
import { ownCopyGateLayerBrokerProxy } from './own-copy-gate-layer-broker.proxy';

const REPO_ROOT = '/repo';
const OWN_SRC_ROOT = '/dm/node_modules/@dungeonmaster/npm/src';
const SRC_ROOT = '/repo/packages/@gateway/npm/src';

describe('ownCopyGateLayerBroker', () => {
  it('INVALID: {installed 3.23.8, ours ^4.6.5} => skips for version, naming both', async () => {
    const proxy = ownCopyGateLayerBrokerProxy();
    proxy.setupInstalled({ repoRoot: REPO_ROOT, packageName: 'zod', version: '3.23.8' });

    const result = await ownCopyGateLayerBroker({
      repoRoot: REPO_ROOT,
      ownSrcRoot: OWN_SRC_ROOT,
      ownPackageJson: PackageJsonStub({ dependencies: { zod: '^4.6.5' } }),
      dependency: GatewayNpmDependencyStub({ name: 'zod', range: '^3.23.0', folder: 'zod' }),
      copyPlan: ['zod'],
      plannedCopies: [],
      plannedFiles: [],
    });

    expect(result).toStrictEqual({
      name: 'zod',
      reason: 'version',
      installed: '3.23.8',
      ours: '^4.6.5',
    });
  });

  it('INVALID: {not installed} => skips for version, naming only our range', async () => {
    const proxy = ownCopyGateLayerBrokerProxy();
    proxy.setupInstalled({ repoRoot: REPO_ROOT, packageName: 'zod', version: null });

    const result = await ownCopyGateLayerBroker({
      repoRoot: REPO_ROOT,
      ownSrcRoot: OWN_SRC_ROOT,
      ownPackageJson: PackageJsonStub({ dependencies: { zod: '^4.6.5' } }),
      dependency: GatewayNpmDependencyStub({ name: 'zod', range: '^4.0.0', folder: 'zod' }),
      copyPlan: ['zod'],
      plannedCopies: [],
      plannedFiles: [],
    });

    expect(result).toStrictEqual({ name: 'zod', reason: 'version', ours: '^4.6.5' });
  });

  it('INVALID: {we declare no range for it} => skips for version, naming only the installed version', async () => {
    const proxy = ownCopyGateLayerBrokerProxy();
    proxy.setupInstalled({ repoRoot: REPO_ROOT, packageName: 'zod', version: '4.6.5' });

    const result = await ownCopyGateLayerBroker({
      repoRoot: REPO_ROOT,
      ownSrcRoot: OWN_SRC_ROOT,
      ownPackageJson: null,
      dependency: GatewayNpmDependencyStub({ name: 'zod', range: '^4.0.0', folder: 'zod' }),
      copyPlan: ['zod'],
      plannedCopies: [],
      plannedFiles: [],
    });

    expect(result).toStrictEqual({ name: 'zod', reason: 'version', installed: '4.6.5' });
  });

  it('INVALID: {range satisfied through peerDependencies, plan already esm-only} => passes the plan reason on', async () => {
    const proxy = ownCopyGateLayerBrokerProxy();
    proxy.setupInstalled({ repoRoot: REPO_ROOT, packageName: 'eslint', version: '9.36.0' });

    const result = await ownCopyGateLayerBroker({
      repoRoot: REPO_ROOT,
      ownSrcRoot: OWN_SRC_ROOT,
      ownPackageJson: PackageJsonStub({ peerDependencies: { eslint: '^9.36.0' } }),
      dependency: GatewayNpmDependencyStub({ name: 'eslint', range: '^9.0.0', folder: 'eslint' }),
      copyPlan: 'esm-only',
      plannedCopies: [],
      plannedFiles: [],
    });

    expect(result).toStrictEqual({
      name: 'eslint',
      reason: 'esm-only',
      installed: '9.36.0',
      ours: '^9.36.0',
    });
  });

  it('VALID: {range satisfied, our folder compiles} => returns null', async () => {
    const proxy = ownCopyGateLayerBrokerProxy();
    proxy.setupInstalled({ repoRoot: REPO_ROOT, packageName: 'zod', version: '4.7.0' });
    proxy.setupOwnFolder({
      ownSrcRoot: OWN_SRC_ROOT,
      folder: 'zod',
      files: {
        'zod.ts': "export { zodLike } from './zod-like/zod-like';\n",
        'zod-like/zod-like.ts': 'export const zodLike: number = 1;\n',
      },
    });

    const result = await ownCopyGateLayerBroker({
      repoRoot: REPO_ROOT,
      ownSrcRoot: OWN_SRC_ROOT,
      ownPackageJson: PackageJsonStub({ dependencies: { zod: '^4.6.5' } }),
      dependency: GatewayNpmDependencyStub({ name: 'zod', range: '^4.0.0', folder: 'zod' }),
      copyPlan: ['zod'],
      plannedCopies: [],
      plannedFiles: [],
    });

    expect(result).toBe(null);
  });

  it('INVALID: {range satisfied, our folder does not compile} => skips for compile, naming both versions', async () => {
    const proxy = ownCopyGateLayerBrokerProxy();
    proxy.setupInstalled({ repoRoot: REPO_ROOT, packageName: 'zod', version: '4.7.0' });
    proxy.setupOwnFolder({
      ownSrcRoot: OWN_SRC_ROOT,
      folder: 'zod',
      files: { 'zod.ts': "export const zodLike: number = 'one';\n" },
    });

    const result = await ownCopyGateLayerBroker({
      repoRoot: REPO_ROOT,
      ownSrcRoot: OWN_SRC_ROOT,
      ownPackageJson: PackageJsonStub({ dependencies: { zod: '^4.6.5' } }),
      dependency: GatewayNpmDependencyStub({ name: 'zod', range: '^4.0.0', folder: 'zod' }),
      copyPlan: ['zod'],
      plannedCopies: [],
      plannedFiles: [],
    });

    expect(result).toStrictEqual({
      name: 'zod',
      reason: 'compile',
      installed: '4.7.0',
      ours: '^4.6.5',
    });
  });

  it('VALID: {our folder imports folders this run copies or generates before it} => compiles against them and returns null', async () => {
    const proxy = ownCopyGateLayerBrokerProxy();
    proxy.setupInstalled({ repoRoot: REPO_ROOT, packageName: 'zod', version: '4.7.0' });
    proxy.setupOwnFolder({
      ownSrcRoot: OWN_SRC_ROOT,
      folder: 'zod',
      files: {
        'zod.ts':
          "import { left } from '#gateway/npm/left';\nimport { right } from '#gateway/npm/right';\nexport const zodLike: number = left + right;\n",
      },
    });
    proxy.setupOwnFolder({
      ownSrcRoot: OWN_SRC_ROOT,
      folder: 'left',
      files: { 'left.ts': 'export const left = 1;\n' },
    });

    const result = await ownCopyGateLayerBroker({
      repoRoot: REPO_ROOT,
      ownSrcRoot: OWN_SRC_ROOT,
      ownPackageJson: PackageJsonStub({ dependencies: { zod: '^4.6.5' } }),
      dependency: GatewayNpmDependencyStub({ name: 'zod', range: '^4.0.0', folder: 'zod' }),
      copyPlan: ['zod'],
      plannedCopies: [[`${OWN_SRC_ROOT}/left`, `${SRC_ROOT}/left`]],
      plannedFiles: [[`${SRC_ROOT}/right/right.ts`, 'export const right = 2;\n']],
    });

    expect(result).toBe(null);
  });
});
