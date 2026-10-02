import { e2eShardCountTransformer } from './e2e-shard-count-transformer';

describe('e2eShardCountTransformer', () => {
  describe('sharding disabled', () => {
    it('VALID: {shardingEnabled: false} => returns 1', () => {
      const result = e2eShardCountTransformer({
        shardingEnabled: false,
        requested: 3,
        specFileCount: 132,
      });

      expect(result).toBe(1);
    });
  });

  describe('test name pattern filtering', () => {
    it('VALID: {testNamePattern: "login"} => returns 1', () => {
      const result = e2eShardCountTransformer({
        shardingEnabled: true,
        requested: 3,
        specFileCount: 132,
        testNamePattern: 'login',
      });

      expect(result).toBe(1);
    });

    it('EMPTY: {testNamePattern: undefined} => returns calculated shard count', () => {
      const result = e2eShardCountTransformer({
        shardingEnabled: true,
        requested: 3,
        specFileCount: 132,
        testNamePattern: undefined,
      });

      expect(result).toBe(3);
    });
  });

  describe('spec file count boundaries', () => {
    it('VALID: {specFileCount: 1} => returns 1', () => {
      const result = e2eShardCountTransformer({
        shardingEnabled: true,
        requested: 3,
        specFileCount: 1,
      });

      expect(result).toBe(1);
    });

    it('VALID: {specFileCount: 2, requested: 3} => returns 2', () => {
      const result = e2eShardCountTransformer({
        shardingEnabled: true,
        requested: 3,
        specFileCount: 2,
      });

      expect(result).toBe(2);
    });

    it('VALID: {specFileCount: 132, requested: 3} => returns 3', () => {
      const result = e2eShardCountTransformer({
        shardingEnabled: true,
        requested: 3,
        specFileCount: 132,
      });

      expect(result).toBe(3);
    });

    it('EDGE: {specFileCount: 0} => returns 1', () => {
      const result = e2eShardCountTransformer({
        shardingEnabled: true,
        requested: 3,
        specFileCount: 0,
      });

      expect(result).toBe(1);
    });
  });

  describe('requested shard count variations', () => {
    it('VALID: {requested: omitted} => defaults to 3', () => {
      const result = e2eShardCountTransformer({
        shardingEnabled: true,
        specFileCount: 10,
      });

      expect(result).toBe(3);
    });

    it('VALID: {requested: 2, specFileCount: 10} => returns 2', () => {
      const result = e2eShardCountTransformer({
        shardingEnabled: true,
        requested: 2,
        specFileCount: 10,
      });

      expect(result).toBe(2);
    });

    it('EDGE: {requested: 0} => returns 1', () => {
      const result = e2eShardCountTransformer({
        shardingEnabled: true,
        requested: 0,
        specFileCount: 10,
      });

      expect(result).toBe(1);
    });
  });
});
