import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts/absolute-file-path/absolute-file-path.stub';

import { binWorkspaceRootLayerBroker } from './bin-workspace-root-layer-broker';
import { binWorkspaceRootLayerBrokerProxy } from './bin-workspace-root-layer-broker.proxy';

describe('binWorkspaceRootLayerBroker', () => {
  describe('package.json declares workspaces', () => {
    it('VALID: {workspaces: ["packages/*"]} => returns true', () => {
      const proxy = binWorkspaceRootLayerBrokerProxy();
      const dir = AbsoluteFilePathStub({ value: '/repo' });
      proxy.setupWorkspaceRoot({ dir });

      expect(binWorkspaceRootLayerBroker({ dir })).toBe(true);
    });
  });

  describe('package.json does not declare workspaces', () => {
    it('VALID: {no workspaces field} => returns false', () => {
      const proxy = binWorkspaceRootLayerBrokerProxy();
      const dir = AbsoluteFilePathStub({ value: '/repo/packages/a' });
      proxy.setupPlainPackage({ dir });

      expect(binWorkspaceRootLayerBroker({ dir })).toBe(false);
    });

    it('EMPTY: {no package.json} => returns false', () => {
      const proxy = binWorkspaceRootLayerBrokerProxy();
      const dir = AbsoluteFilePathStub({ value: '/repo/packages' });
      proxy.setupNoPackageJson({ dir });

      expect(binWorkspaceRootLayerBroker({ dir })).toBe(false);
    });

    it('INVALID: {package.json is not JSON} => returns false', () => {
      const proxy = binWorkspaceRootLayerBrokerProxy();
      const dir = AbsoluteFilePathStub({ value: '/repo/packages/b' });
      proxy.setupMalformedPackageJson({ dir });

      expect(binWorkspaceRootLayerBroker({ dir })).toBe(false);
    });
  });
});
