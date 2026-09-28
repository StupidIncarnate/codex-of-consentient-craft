import { findAncestorDirectoryLayerBroker } from './find-ancestor-directory-layer-broker';
import { findAncestorDirectoryLayerBrokerProxy } from './find-ancestor-directory-layer-broker.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

describe('findAncestorDirectoryLayerBroker', () => {
  describe('marker found', () => {
    it('VALID: {startDir holds marker} => returns startDir itself', () => {
      const proxy = findAncestorDirectoryLayerBrokerProxy();
      proxy.setupMarkerAt({ dirPath: '/repo/packages/node', markerFileName: 'package.json' });

      const result = findAncestorDirectoryLayerBroker({
        startDir: FilePathStub({ value: '/repo/packages/node' }),
        markerFileName: 'package.json',
      });

      expect(result).toBe('/repo/packages/node');
    });

    it('VALID: {marker several levels up} => returns the ancestor holding it', () => {
      const proxy = findAncestorDirectoryLayerBrokerProxy();
      proxy.setupNoMarkerAt({
        dirPath: '/repo/packages/node/src/fs',
        markerFileName: 'package.json',
      });
      proxy.setupNoMarkerAt({ dirPath: '/repo/packages/node/src', markerFileName: 'package.json' });
      proxy.setupMarkerAt({ dirPath: '/repo/packages/node', markerFileName: 'package.json' });

      const result = findAncestorDirectoryLayerBroker({
        startDir: FilePathStub({ value: '/repo/packages/node/src/fs' }),
        markerFileName: 'package.json',
      });

      expect(result).toBe('/repo/packages/node');
    });

    it('VALID: {marker is .dungeonmaster.json at repo root} => returns repo root', () => {
      const proxy = findAncestorDirectoryLayerBrokerProxy();
      proxy.setupNoMarkerAt({
        dirPath: '/repo/packages/node/src/fs',
        markerFileName: '.dungeonmaster.json',
      });
      proxy.setupNoMarkerAt({
        dirPath: '/repo/packages/node/src',
        markerFileName: '.dungeonmaster.json',
      });
      proxy.setupNoMarkerAt({
        dirPath: '/repo/packages/node',
        markerFileName: '.dungeonmaster.json',
      });
      proxy.setupNoMarkerAt({ dirPath: '/repo/packages', markerFileName: '.dungeonmaster.json' });
      proxy.setupMarkerAt({ dirPath: '/repo', markerFileName: '.dungeonmaster.json' });

      const result = findAncestorDirectoryLayerBroker({
        startDir: FilePathStub({ value: '/repo/packages/node/src/fs' }),
        markerFileName: '.dungeonmaster.json',
      });

      expect(result).toBe('/repo');
    });
  });

  describe('marker not found', () => {
    it('EMPTY: {no ancestor holds marker} => returns undefined', () => {
      const proxy = findAncestorDirectoryLayerBrokerProxy();
      proxy.setupNoMarkerAt({
        dirPath: '/repo/packages/node/src/fs',
        markerFileName: 'package.json',
      });
      proxy.setupNoMarkerAt({ dirPath: '/repo/packages/node/src', markerFileName: 'package.json' });
      proxy.setupNoMarkerAt({ dirPath: '/repo/packages/node', markerFileName: 'package.json' });
      proxy.setupNoMarkerAt({ dirPath: '/repo/packages', markerFileName: 'package.json' });
      proxy.setupNoMarkerAt({ dirPath: '/repo', markerFileName: 'package.json' });
      proxy.setupNoMarkerAt({ dirPath: '/', markerFileName: 'package.json' });

      const result = findAncestorDirectoryLayerBroker({
        startDir: FilePathStub({ value: '/repo/packages/node/src/fs' }),
        markerFileName: 'package.json',
      });

      expect(result).toBe(undefined);
    });
  });
});
