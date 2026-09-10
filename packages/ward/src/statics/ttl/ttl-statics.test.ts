import { ttlStatics } from './ttl-statics';

describe('ttlStatics', () => {
  // TWO DAYS, SET BETWEEN THE DISPATCH QUEUE AND THE DISK. A spiritmender reads its red run back
  // with `npm run ward -- detail <runId>`, and the gap between the failing run and that session is
  // however long the queue takes — measured once at 69 minutes, which expired the evidence and left
  // the repair working blind off `git diff --name-only`. That is the floor. The ceiling is what
  // retention costs: a run result is mostly raw check stdout, measured at 96.4% of one 295.7 MB
  // file, so each extra day is gigabytes.
  it('VALID: exported value => matches expected shape', () => {
    expect(ttlStatics).toStrictEqual({
      runResultTtl: 172800000,
    });
  });
});
