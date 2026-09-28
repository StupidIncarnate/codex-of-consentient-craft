import { adapterCensusContract } from './adapter-census-contract';
import type { AdapterCensus } from './adapter-census-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const AdapterCensusStub = ({ ...props }: StubArgument<AdapterCensus> = {}): AdapterCensus =>
  adapterCensusContract.parse({
    scope: '@acme',
    packages: [],
    totals: {
      adapters: 0,
      passThrough: 0,
      logic: 0,
      productionCallers: 0,
      composingProxies: 0,
      catchAllProxies: 0,
    },
    ...props,
  });
