import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { BinCommandStub } from '../../../contracts/bin-command/bin-command.stub';

import { binWalkUpLayerBroker } from './bin-walk-up-layer-broker';
import { binWalkUpLayerBrokerProxy } from './bin-walk-up-layer-broker.proxy';

describe('binWalkUpLayerBroker', () => {
  describe('binary in the starting directory', () => {
    it('VALID: {jest in /repo/packages/ward/node_modules/.bin} => returns that absolute path', () => {
      const proxy = binWalkUpLayerBrokerProxy();
      const dir = AbsoluteFilePathStub({ value: '/repo/packages/ward' });
      const binName = BinCommandStub({ value: 'jest' });
      proxy.setupWalk({ dir, binName, binDir: dir, workspaceRoot: null });

      const result = binWalkUpLayerBroker({ binName, dir });

      expect(String(result)).toBe('/repo/packages/ward/node_modules/.bin/jest');
    });
  });

  describe('binary in an ancestor', () => {
    it('VALID: {jest only in the workspace root} => returns the root path', () => {
      const proxy = binWalkUpLayerBrokerProxy();
      const dir = AbsoluteFilePathStub({ value: '/repo/packages/ward' });
      const root = AbsoluteFilePathStub({ value: '/repo' });
      const binName = BinCommandStub({ value: 'jest' });
      proxy.setupWalk({ dir, binName, binDir: root, workspaceRoot: root });

      const result = binWalkUpLayerBroker({ binName, dir });

      expect(String(result)).toBe('/repo/node_modules/.bin/jest');
    });

    it('VALID: {jest in the package and the root} => the package copy wins', () => {
      const proxy = binWalkUpLayerBrokerProxy();
      const dir = AbsoluteFilePathStub({ value: '/repo/packages/ward' });
      const root = AbsoluteFilePathStub({ value: '/repo' });
      const binName = BinCommandStub({ value: 'jest' });
      proxy.setupWalk({ dir, binName, binDir: dir, workspaceRoot: root });

      const result = binWalkUpLayerBroker({ binName, dir });

      expect(String(result)).toBe('/repo/packages/ward/node_modules/.bin/jest');
    });

    it('VALID: {jest in an intermediate directory below the root} => returns the intermediate path', () => {
      const proxy = binWalkUpLayerBrokerProxy();
      const dir = AbsoluteFilePathStub({ value: '/repo/packages/ward/src' });
      const middle = AbsoluteFilePathStub({ value: '/repo/packages' });
      const root = AbsoluteFilePathStub({ value: '/repo' });
      const binName = BinCommandStub({ value: 'jest' });
      proxy.setupWalk({ dir, binName, binDir: middle, workspaceRoot: root });

      const result = binWalkUpLayerBroker({ binName, dir });

      expect(String(result)).toBe('/repo/packages/node_modules/.bin/jest');
    });
  });

  describe('binary not found', () => {
    it('VALID: {no .bin from the package to the workspace root} => returns the bare name', () => {
      const proxy = binWalkUpLayerBrokerProxy();
      const dir = AbsoluteFilePathStub({ value: '/repo/packages/ward' });
      const root = AbsoluteFilePathStub({ value: '/repo' });
      const binName = BinCommandStub({ value: 'jest' });
      proxy.setupWalk({ dir, binName, binDir: null, workspaceRoot: root });

      const result = binWalkUpLayerBroker({ binName, dir });

      expect(String(result)).toBe('jest');
    });

    it('VALID: {no .bin up to the workspace root} => stops at the root without reading above it, and returns the bare name', () => {
      const proxy = binWalkUpLayerBrokerProxy();
      const dir = AbsoluteFilePathStub({ value: '/home/me/repo/packages/ward' });
      const root = AbsoluteFilePathStub({ value: '/home/me/repo' });
      const binName = BinCommandStub({ value: 'jest' });
      proxy.setupWalk({ dir, binName, binDir: null, workspaceRoot: root });

      const result = binWalkUpLayerBroker({ binName, dir });

      expect(String(result)).toBe('jest');
    });

    it('EDGE: {no workspaces anywhere and no .bin} => walks to the filesystem root and returns the bare name', () => {
      const proxy = binWalkUpLayerBrokerProxy();
      const dir = AbsoluteFilePathStub({ value: '/solo/pkg' });
      const binName = BinCommandStub({ value: 'tsc' });
      proxy.setupWalk({ dir, binName, binDir: null, workspaceRoot: null });

      const result = binWalkUpLayerBroker({ binName, dir });

      expect(String(result)).toBe('tsc');
    });

    it('EDGE: {no workspaces anywhere, .bin at the filesystem root} => returns the root path', () => {
      const proxy = binWalkUpLayerBrokerProxy();
      const dir = AbsoluteFilePathStub({ value: '/solo/pkg' });
      const fsRoot = AbsoluteFilePathStub({ value: '/' });
      const binName = BinCommandStub({ value: 'tsc' });
      proxy.setupWalk({ dir, binName, binDir: fsRoot, workspaceRoot: null });

      const result = binWalkUpLayerBroker({ binName, dir });

      expect(String(result)).toBe('/node_modules/.bin/tsc');
    });
  });
});
