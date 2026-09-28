import { sourceFactsContract } from './source-facts-contract';
import type { SourceFacts } from './source-facts-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const SourceFactsStub = ({ ...props }: StubArgument<SourceFacts> = {}): SourceFacts =>
  sourceFactsContract.parse({
    imports: [],
    reExports: [],
    exportNames: [],
    catchAllSites: [],
    ...props,
  });
