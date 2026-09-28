import { routedGraphOutcomeWordContract } from './routed-graph-outcome-word-contract';
import type { RoutedGraphOutcomeWord } from './routed-graph-outcome-word-contract';

export const RoutedGraphOutcomeWordStub = (
  { value }: { value: string } = { value: 'done' },
): RoutedGraphOutcomeWord => routedGraphOutcomeWordContract.parse(value);
