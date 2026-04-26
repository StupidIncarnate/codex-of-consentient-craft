import { fsQueueMetadataReadAdapter } from './fs-queue-metadata-read-adapter';
import { fsQueueMetadataReadAdapterProxy } from './fs-queue-metadata-read-adapter.proxy';
import { QueueMetadataStub } from '../../../contracts/queue-metadata/queue-metadata.stub';

describe('fsQueueMetadataReadAdapter', () => {
  describe('successful reads', () => {
    it('VALID: {metadataPath, counter: 0} => returns metadata with zero counter', () => {
      const proxy = fsQueueMetadataReadAdapterProxy();
      const metadataPath = '/tmp/queue/metadata.json';
      const metadata = QueueMetadataStub({ counter: 0 });

      proxy.returns({ metadataPath, metadata });

      const result = fsQueueMetadataReadAdapter({ metadataPath });

      expect(result.counter).toBe(0);
    });

    it('VALID: {metadataPath, counter: 5} => returns metadata with incremented counter', () => {
      const proxy = fsQueueMetadataReadAdapterProxy();
      const metadataPath = '/tmp/queue/metadata.json';
      const metadata = QueueMetadataStub({ counter: 5 });

      proxy.returns({ metadataPath, metadata });

      const result = fsQueueMetadataReadAdapter({ metadataPath });

      expect(result.counter).toBe(5);
    });
  });

  describe('error cases', () => {
    it('ERROR: {metadataPath: "/nonexistent"} => throws file not found error', () => {
      const proxy = fsQueueMetadataReadAdapterProxy();
      const metadataPath = '/nonexistent/metadata.json';

      proxy.throws({ metadataPath, error: new Error('ENOENT: no such file or directory') });

      expect(() => {
        fsQueueMetadataReadAdapter({ metadataPath });
      }).toThrow(/ENOENT/u);
    });
  });
});
