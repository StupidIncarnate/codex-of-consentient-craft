import { statusTableStatics } from './status-table-statics';

describe('statusTableStatics', () => {
  it('VALID: exported value => matches the complete statics shape', () => {
    expect(statusTableStatics).toStrictEqual({
      table: {
        headers: ['ID', 'STATE', 'SPEC', 'BRANCH', 'UPTIME', 'LAST BEAT', 'RUNS', 'RSS', 'ORPHANS'],
        cellPadding: 2,
      },
    });
  });
});
