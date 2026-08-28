import { ttlStatics } from './ttl-statics';

describe('ttlStatics', () => {
  // SEVEN DAYS, AND THE FLOOR IS SET BY THE DISPATCH QUEUE RATHER THAN BY DISK. A spiritmender reads
  // its red run back with `npm run ward -- detail <runId>`, and the gap between the failing run and
  // that session is however long the queue takes — measured once at 69 minutes, which expired the
  // evidence and left the repair working blind off `git diff --name-only`. A quest can sit in that
  // queue across days, so the TTL is sized against how long work waits, not how long a run takes.
  it('VALID: exported value => matches expected shape', () => {
    expect(ttlStatics).toStrictEqual({
      runResultTtl: 604800000,
    });
  });
});
