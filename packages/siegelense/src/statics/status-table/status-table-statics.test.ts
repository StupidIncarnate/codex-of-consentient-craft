import { statusTableStatics } from './status-table-statics';

describe('statusTableStatics', () => {
  it('VALID: exported value => matches the complete statics shape', () => {
    expect(statusTableStatics).toStrictEqual({
      table: {
        headers: [
          'ID',
          'STATE',
          'SPEC',
          'BRANCH',
          'UPTIME',
          'LAST BEAT',
          'RUNS',
          'MEMORY',
          'ORPHANS',
        ],
        cellPadding: 2,
      },
      singleInstanceTable: {
        headers: ['FIELD', 'VALUE'],
        cellPadding: 2,
      },
      evidenceTree: {
        indent: '  ',
      },
      sinceWindows: {
        order: ['1h', '6h', '1d', '1wk'],
        widest: '1wk',
        display: {
          '1h': '1hr',
          '6h': '6hr',
          '1d': '1day',
          '1wk': '1wk',
        },
      },
    });
  });
});
