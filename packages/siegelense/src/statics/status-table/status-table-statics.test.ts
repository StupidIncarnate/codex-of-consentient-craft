import { statusTableStatics } from './status-table-statics';

describe('statusTableStatics', () => {
  it('VALID: exported value => matches the complete statics shape', () => {
    expect(statusTableStatics).toStrictEqual({
      table: {
        headers: ['ID', 'STATE', 'SPEC', 'BRANCH', 'UPTIME', 'LAST BEAT', 'RUNS', 'RSS', 'ORPHANS'],
        cellPadding: 2,
      },
      singleInstanceTable: {
        headers: ['FIELD', 'VALUE'],
        cellPadding: 2,
      },
      sinceWindows: {
        order: ['1h', '6h', '1d', 'beginning'],
        widest: 'beginning',
        display: {
          '1h': '1hr',
          '6h': '6hr',
          '1d': '1day',
          beginning: 'beginning',
        },
      },
    });
  });
});
