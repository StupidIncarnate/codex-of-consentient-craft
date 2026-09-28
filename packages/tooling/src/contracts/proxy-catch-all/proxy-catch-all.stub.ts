import { proxyCatchAllContract } from './proxy-catch-all-contract';
import type { ProxyCatchAll } from './proxy-catch-all-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { CatchAllSiteStub } from '../catch-all-site/catch-all-site.stub';

export const ProxyCatchAllStub = ({ ...props }: StubArgument<ProxyCatchAll> = {}): ProxyCatchAll =>
  proxyCatchAllContract.parse({
    file: 'packages/example/src/example.proxy.ts',
    sites: [CatchAllSiteStub()],
    ...props,
  });
