import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';

import { queueMetadataReadBroker } from './queue-metadata-read-broker';
import { queueMetadataReadBrokerProxy } from './queue-metadata-read-broker.proxy';

describe('queueMetadataReadBroker', () => {
  describe('successful reads', () => {
    it('VALID: {metadata.json with counter 0} => returns {counter: 0}', () => {
      const proxy = queueMetadataReadBrokerProxy();
      proxy.returns({ metadataPath: '/tmp/queue/metadata.json', json: '{"counter":0}' });

      const result = queueMetadataReadBroker({ metadataPath: '/tmp/queue/metadata.json' });

      expect(result).toStrictEqual({ counter: 0 });
    });

    it('VALID: {metadata.json with counter 5} => returns {counter: 5}', () => {
      const proxy = queueMetadataReadBrokerProxy();
      proxy.returns({ metadataPath: '/tmp/queue/metadata.json', json: '{"counter":5}' });

      const result = queueMetadataReadBroker({ metadataPath: '/tmp/queue/metadata.json' });

      expect(result).toStrictEqual({ counter: 5 });
    });

    it('VALID: {two queue dirs, different counters} => each path reads its own file', () => {
      const proxy = queueMetadataReadBrokerProxy();
      proxy.returns({ metadataPath: '/tmp/claude-queue/metadata.json', json: '{"counter":2}' });
      proxy.returns({ metadataPath: '/tmp/ward-queue/metadata.json', json: '{"counter":7}' });

      const results = [
        queueMetadataReadBroker({ metadataPath: '/tmp/claude-queue/metadata.json' }),
        queueMetadataReadBroker({ metadataPath: '/tmp/ward-queue/metadata.json' }),
      ];

      expect(results).toStrictEqual([{ counter: 2 }, { counter: 7 }]);
    });
  });

  describe('invalid metadata', () => {
    it('INVALID: {counter: -1} => throws a contract error', () => {
      const proxy = queueMetadataReadBrokerProxy();
      proxy.returns({ metadataPath: '/tmp/queue/metadata.json', json: '{"counter":-1}' });

      expect(() => queueMetadataReadBroker({ metadataPath: '/tmp/queue/metadata.json' })).toThrow(
        /too_small/u,
      );
    });

    it('INVALID: {no counter field} => throws a contract error', () => {
      const proxy = queueMetadataReadBrokerProxy();
      proxy.returns({ metadataPath: '/tmp/queue/metadata.json', json: '{}' });

      expect(() => queueMetadataReadBroker({ metadataPath: '/tmp/queue/metadata.json' })).toThrow(
        /expected number/u,
      );
    });

    it('INVALID: {file content is not JSON} => throws a SyntaxError naming the path', () => {
      const proxy = queueMetadataReadBrokerProxy();
      proxy.returns({ metadataPath: '/tmp/queue/metadata.json', json: 'not json' });

      expect(() => queueMetadataReadBroker({ metadataPath: '/tmp/queue/metadata.json' })).toThrow(
        /^Invalid JSON in \/tmp\/queue\/metadata\.json: /u,
      );
    });
  });

  describe('missing file', () => {
    it('ERROR: {ENOENT} => the fs error passes through untouched', () => {
      const proxy = queueMetadataReadBrokerProxy();
      const error = FsErrorStub({
        code: 'ENOENT',
        path: '/tmp/gone/metadata.json',
        syscall: 'open',
      });
      proxy.throws({ metadataPath: '/tmp/gone/metadata.json', error });

      expect(() => queueMetadataReadBroker({ metadataPath: '/tmp/gone/metadata.json' })).toThrow(
        /^ENOENT: open '\/tmp\/gone\/metadata\.json'$/u,
      );
    });
  });
});
