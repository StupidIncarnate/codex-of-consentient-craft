/**
 * PURPOSE: Creates test data for discover tree format results
 *
 * USAGE:
 * const result = DiscoverTreeResultStub({ results: TreeOutputStub({ value: '...' }), count: ResultCountStub({ value: 2 }) });
 * // Returns validated tree format discover result
 */
import { discoverTreeResultContract } from './discover-tree-result-contract';
import type { DiscoverTreeResult } from './discover-tree-result-contract';
import type { StubArgument } from '@questmaestro/shared/@types';
import { TreeOutputStub } from '../tree-output/tree-output.stub';
import { ResultCountStub } from '../result-count/result-count.stub';

export const DiscoverTreeResultStub = ({
  ...props
}: StubArgument<DiscoverTreeResult> = {}): DiscoverTreeResult =>
  discoverTreeResultContract.parse({
    results: TreeOutputStub({ value: 'guards/\n  example-guard (guard)' }),
    count: ResultCountStub({ value: 1 }),
    ...props,
  });
