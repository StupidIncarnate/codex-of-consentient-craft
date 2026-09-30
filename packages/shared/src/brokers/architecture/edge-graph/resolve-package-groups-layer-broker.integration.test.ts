import { resolvePackageGroupsLayerBroker } from './resolve-package-groups-layer-broker';
import { architecturePackageTypeDetectBroker } from '../package-type-detect/architecture-package-type-detect-broker';
import { cwd as getCwd } from '#gateway/node/process';

const cwd = getCwd();
const projectRoot = cwd.slice(0, cwd.lastIndexOf('/packages/'));

describe('resolvePackageGroupsLayerBroker (integration with real monorepo)', () => {
  it('VALID: {real monorepo} => server is an http-backend root, agreeing with the package-type detector', async () => {
    const serverRoot = `${projectRoot}/packages/server`;

    const { httpBackendRoots } = resolvePackageGroupsLayerBroker({ projectRoot });
    const serverTypes = await architecturePackageTypeDetectBroker({ packageRoot: serverRoot });

    expect({
      serverBuckets: httpBackendRoots.filter((root) => root === serverRoot),
      detectorHeadline: serverTypes[0],
    }).toStrictEqual({ serverBuckets: [serverRoot], detectorHeadline: 'http-backend' });
  });

  it('VALID: {real monorepo} => a library package such as shared is not an http-backend root', () => {
    const sharedRoot = `${projectRoot}/packages/shared`;

    const { httpBackendRoots } = resolvePackageGroupsLayerBroker({ projectRoot });

    expect(httpBackendRoots.filter((root) => root === sharedRoot)).toStrictEqual([]);
  });
});
