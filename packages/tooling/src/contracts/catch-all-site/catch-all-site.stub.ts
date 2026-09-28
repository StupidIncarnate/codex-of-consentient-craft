import { catchAllSiteContract } from './catch-all-site-contract';
import type { CatchAllSite } from './catch-all-site-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const CatchAllSiteStub = ({ ...props }: StubArgument<CatchAllSite> = {}): CatchAllSite =>
  catchAllSiteContract.parse({
    line: 3,
    kind: 'empty-address',
    snippet: 'handle.calledWith([])',
    ...props,
  });
