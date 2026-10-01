import { ContractIndexShardStub } from './contract-index-shard.stub';
import { contractIndexShardContract } from './contract-index-shard-contract';

describe('contractIndexShardContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses to the same shard', () => {
      expect(contractIndexShardContract.parse(ContractIndexShardStub())).toStrictEqual({
        schemaVersion: 1,
        sharedVersion: '0.1.0',
        packageName: '@repo/alpha',
        packageDir: '/repo/packages/alpha',
        files: [],
      });
    });

    it('VALID: {one file with an empty read} => keeps its hash and read', () => {
      const shard = ContractIndexShardStub({
        files: [
          {
            filePath: '/repo/packages/alpha/src/brokers/x/x-broker.ts',
            contentHash: 'b'.repeat(64),
            read: { imports: [], reExports: [], exports: null, parseCalls: [], valueNames: [] },
          },
        ],
      });

      expect(contractIndexShardContract.parse(shard).files).toStrictEqual([
        {
          filePath: '/repo/packages/alpha/src/brokers/x/x-broker.ts',
          contentHash: 'b'.repeat(64),
          read: { imports: [], reExports: [], exports: null, parseCalls: [], valueNames: [] },
        },
      ]);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {files: not a list} => throws', () => {
      expect(() =>
        contractIndexShardContract.parse({ ...ContractIndexShardStub(), files: 'x' }),
      ).toThrow(/expected array/iu);
    });
  });
});
