import type { StubArgument } from '@dungeonmaster/shared/@types';

import { servedBuildStaleContract, type ServedBuildStale } from './served-build-stale-contract';

export const ServedBuildStaleStub = ({
  ...props
}: StubArgument<ServedBuildStale> = {}): ServedBuildStale =>
  servedBuildStaleContract.parse({
    outDir: 'packages/web/dist',
    builtAtMs: 1_790_717_738_233,
    baseCommit: 'fd13432c156a579b5bf862f89a681309a42b3153',
    changedFiles: ['packages/web/src/app.tsx'],
    ...props,
  });
