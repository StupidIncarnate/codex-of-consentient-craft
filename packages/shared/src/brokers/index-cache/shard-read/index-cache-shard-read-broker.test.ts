import { indexCacheShardReadBroker } from './index-cache-shard-read-broker';
import { indexCacheShardReadBrokerProxy } from './index-cache-shard-read-broker.proxy';

const shardPath = '/repo/node_modules/.cache/dungeonmaster/contract-index/@repo__alpha.json';

describe('indexCacheShardReadBroker', () => {
  it('VALID: {shard holds JSON, parse accepts it} => returns what parse returns', () => {
    const proxy = indexCacheShardReadBrokerProxy();
    proxy.setupShard({ shardPath, contents: '{"schemaVersion":1,"files":[]}' });

    expect(
      indexCacheShardReadBroker({ shardPath, parse: (value: unknown): unknown => value }),
    ).toStrictEqual({ schemaVersion: 1, files: [] });
  });

  it('INVALID: {parse rejects the shard} => returns null', () => {
    const proxy = indexCacheShardReadBrokerProxy();
    proxy.setupShard({ shardPath, contents: '{"files":"not a list"}' });

    expect(indexCacheShardReadBroker({ shardPath, parse: (): null => null })).toBe(null);
  });

  it('INVALID: {shard is truncated JSON} => returns null without calling parse', () => {
    const proxy = indexCacheShardReadBrokerProxy();
    proxy.setupShard({ shardPath, contents: '{"schemaVersion":1,"fi' });
    const parse = jest.fn();

    expect({
      result: indexCacheShardReadBroker({ shardPath, parse }),
      parseCalls: parse.mock.calls,
    }).toStrictEqual({ result: null, parseCalls: [] });
  });

  it('EMPTY: {no shard on disk} => returns null', () => {
    indexCacheShardReadBrokerProxy();

    expect(
      indexCacheShardReadBroker({ shardPath, parse: (value: unknown): unknown => value }),
    ).toBe(null);
  });
});
