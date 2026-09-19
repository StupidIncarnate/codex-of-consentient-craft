import { snapshotsTableStatics } from './snapshots-table-statics';

describe('snapshotsTableStatics', () => {
  it('VALID: exported value => matches the complete statics shape', () => {
    expect(snapshotsTableStatics).toStrictEqual({
      table: {
        headers: ['NAME', 'AGE', 'MANUAL'],
        cellPadding: 2,
      },
    });
  });
});
