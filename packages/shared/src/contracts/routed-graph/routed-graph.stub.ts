import type { StubArgument } from '@dungeonmaster/shared/@types';

import { routedGraphContract } from './routed-graph-contract';
import type { RoutedGraph } from './routed-graph-contract';

export const RoutedGraphStub = ({ ...props }: StubArgument<RoutedGraph> = {}): RoutedGraph =>
  routedGraphContract.parse({
    graphName: 'codeweaver',
    entry: 'plan',
    nodes: { plan: { routes: { done: '@done' }, maxVisits: 5 } },
    ...props,
  });
