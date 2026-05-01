import { binEntryCountLayerBroker } from './bin-entry-count-layer-broker';
import { binEntryCountLayerBrokerProxy } from './bin-entry-count-layer-broker.proxy';
import { PackageJsonStub } from '../../../contracts/package-json/package-json.stub';
import { FileCountStub } from '../../../contracts/file-count/file-count.stub';

describe('binEntryCountLayerBroker', () => {
  describe('bin as record', () => {
    it('EMPTY: no bin field => returns 0', () => {
      binEntryCountLayerBrokerProxy();
      const packageJson = PackageJsonStub();

      const result = binEntryCountLayerBroker({ packageJson });

      expect(result).toBe(FileCountStub({ value: 0 }));
    });

    it('VALID: bin record with 1 entry => returns 1', () => {
      binEntryCountLayerBrokerProxy();
      const packageJson = PackageJsonStub({ bin: { dungeonmaster: './dist/bin.js' } });

      const result = binEntryCountLayerBroker({ packageJson });

      expect(result).toBe(FileCountStub({ value: 1 }));
    });

    it('VALID: bin record with 3 entries => returns 3', () => {
      binEntryCountLayerBrokerProxy();
      const packageJson = PackageJsonStub({
        bin: {
          'dm-pre-tool': './dist/pre.js',
          'dm-post-tool': './dist/post.js',
          'dm-session': './dist/session.js',
        },
      });

      const result = binEntryCountLayerBroker({ packageJson });

      expect(result).toBe(FileCountStub({ value: 3 }));
    });
  });

  describe('bin as string shorthand', () => {
    it('VALID: bin as string => returns 1', () => {
      binEntryCountLayerBrokerProxy();
      const packageJson = PackageJsonStub({ bin: './dist/bin.js' });

      const result = binEntryCountLayerBroker({ packageJson });

      expect(result).toBe(FileCountStub({ value: 1 }));
    });
  });
});
