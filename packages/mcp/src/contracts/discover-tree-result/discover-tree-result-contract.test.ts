import { discoverTreeResultContract as _discoverTreeResultContract } from './discover-tree-result-contract';
import { DiscoverTreeResultStub } from './discover-tree-result.stub';
import { TreeOutputStub } from '../tree-output/tree-output.stub';
import { ResultCountStub } from '../result-count/result-count.stub';

describe('discoverTreeResultContract', () => {
  it('VALID: {results: tree string, count: 2} => parses successfully', () => {
    const result = DiscoverTreeResultStub({
      results: TreeOutputStub({ value: 'guards/\n  has-permission-guard (guard)' }),
      count: ResultCountStub({ value: 2 }),
    });

    expect(result.results).toBe('guards/\n  has-permission-guard (guard)');
    expect(result.count).toBe(2);
  });

  it('VALID: {results: empty string, count: 0} => parses successfully', () => {
    const result = DiscoverTreeResultStub({
      results: TreeOutputStub({ value: '' }),
      count: ResultCountStub({ value: 0 }),
    });

    expect(result.results).toBe('');
    expect(result.count).toBe(0);
  });

  it('VALID: {results: multi-folder tree, count: 5} => parses successfully', () => {
    const treeOutput =
      'guards/\n  has-permission-guard (guard)\nbrokers/\n  user-fetch-broker (broker)';
    const result = DiscoverTreeResultStub({
      results: TreeOutputStub({ value: treeOutput }),
      count: ResultCountStub({ value: 5 }),
    });

    expect(result.results).toBe(treeOutput);
    expect(result.count).toBe(5);
  });
});
