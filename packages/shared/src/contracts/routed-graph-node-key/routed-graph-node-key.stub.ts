import { routedGraphNodeKeyContract } from './routed-graph-node-key-contract';
import type { RoutedGraphNodeKey } from './routed-graph-node-key-contract';

export const RoutedGraphNodeKeyStub = (
  { value }: { value: string } = { value: 'plan' },
): RoutedGraphNodeKey => routedGraphNodeKeyContract.parse(value);
